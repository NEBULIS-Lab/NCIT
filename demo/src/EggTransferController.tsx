import { useEffect, useRef } from 'react';
import { findBodyByName, findJointByName, findSiteByName, useBeforePhysicsStep } from 'mujoco-react';
import type { MujocoData, MujocoModel } from 'mujoco-react';
import { consumeMujocoContacts } from './mujocoContact.js';
import { checkEggGate, sampleEggPhase, isForbiddenEggContact, isValidEggPlan, didEggClockReset, isEggInspectionMatch } from './eggTransfer.js';
import type { EggMotionPlan, EggObservation, EggTransferState } from './eggTransfer.js';

declare global {
  interface Window {
    eggTransfer?: { state:EggTransferState; observation:EggObservation|null; history:unknown[] };
  }
}

/** Separate ownership and actuator-only playback. Never writes qpos/qvel. */
export function EggTransferController({requestId,program,resetGeneration,onStateChange,onReseatReady}:{
  requestId:number;program:'transfer'|'reseat';resetGeneration:number;onStateChange:(s:EggTransferState)=>void;onReseatReady:(ready:boolean)=>void;
}) {
  const plan=useRef<EggMotionPlan|null>(null);
  const plans=useRef<Partial<Record<'transfer'|'reseat',EggMotionPlan>>>({});
  const active=useRef(false), lastRequest=useRef(requestId), phaseIndex=useRef(0);
  const startTime=useRef<number|null>(null), startGrip=useRef(255), lostSince=useRef<number|null>(null);
  const previousPhysicsTime=useRef<number|null>(null);
  const state=useRef<EggTransferState>({phase:'loading',label:'Loading checked motion',phaseIndex:0});
  const callback=useRef(onStateChange); callback.current=onStateChange;
  const initial=useRef<number[][]>([]), eggStartHeight=useRef(0), history=useRef<unknown[]>([]);
  const ids=useRef<{qa:number[];da:number[];egg:number;site:number;tray:number;source:number[];fingers:number[];jawQa:number[];eggDof:number;eggs:number[];robotBodies:Set<number>}|null>(null);
  function publish(s:EggTransferState,observation:EggObservation|null=null) {
    state.current=s;
    window.eggTransfer={state:s,observation,history:history.current};
    callback.current(s);
  }

  useEffect(()=>{
    let cancelled=false;
    const abort=new AbortController();
    fetch(`${import.meta.env.BASE_URL}assets/franka-egg-sorting/first-egg-motion.json`,{signal:abort.signal})
      .then(async response=>{
        if(!response.ok) throw new Error(`Motion asset HTTP ${response.status}`);
        const p:unknown=await response.json();
        if(!isValidEggPlan(p)||p.schemaVersion!==1) throw new Error('Invalid or stale motion asset');
        if(cancelled)return;
        plans.current.transfer=p;
        plan.current=p;
        publish({phase:'ready',label:'Ready · Arm 1 / one ivory egg',phaseIndex:0});
      }).catch(error=>{if(!cancelled)publish({phase:'error',label:'Motion unavailable',reason:String(error),phaseIndex:0});});
    return ()=>{cancelled=true;abort.abort();active.current=false;delete window.eggTransfer;};
  },[]);

  // Independent asset loading: the optional correction trial must not block
  // the accepted first-egg recipe if its download is unavailable.
  useEffect(()=>{
    const abort=new AbortController();let cancelled=false;
    onReseatReady(false);
    fetch(`${import.meta.env.BASE_URL}assets/franka-egg-sorting/egg-reseat-motion.json`,{signal:abort.signal})
      .then(async response=>{
        if(!response.ok)throw new Error(`Correction asset HTTP ${response.status}`);
        const p:unknown=await response.json();
        if(!isValidEggPlan(p)||p.schemaVersion!==2||p.program!=='reseat')throw new Error('Invalid correction asset');
        if(cancelled)return;
        plans.current.reseat=p;onReseatReady(true);
      }).catch(error=>{if(!cancelled)console.warn('Correction trial unavailable',error);});
    return ()=>{cancelled=true;abort.abort();};
  },[onReseatReady]);

  useEffect(()=>{
    active.current=false;startTime.current=null;lastRequest.current=requestId;phaseIndex.current=0;
    ids.current=null;lostSince.current=null;history.current=[];
    if(plan.current)publish({phase:'ready',label:'Ready · Arm 1 / one ivory egg',phaseIndex:0});
  },[resetGeneration]);

  function observe(m:MujocoModel,d:MujocoData):EggObservation {
    const r=ids.current!;
    const contacts=consumeMujocoContacts(d.contact,d.ncon);
    const touching=new Set<number>();let traySupported=false,forbiddenPenetration=0,gripPenetration=0;
    const lift=d.xpos[r.egg*3+2]-eggStartHeight.current;
    const allowedSupports=new Set<number>(phaseIndex.current<=3&&lift<.02?r.source:phaseIndex.current>=6?[r.tray]:[]);
    for(const c of contacts) {
      if(c.distance>0)continue;
      const a=m.geom_bodyid[c.geom1],b=m.geom_bodyid[c.geom2];
      const eggContact=a===r.egg||b===r.egg;
      const other=a===r.egg?b:a;
      if(eggContact) {touching.add(other);if(other===r.tray)traySupported=true;}
      if(eggContact&&r.fingers.includes(other))gripPenetration=Math.max(gripPenetration,-c.distance);
      if(isForbiddenEggContact(a,b,{robotBodies:r.robotBodies,fingers:r.fingers,egg:r.egg,allowedSupports}))
        forbiddenPenetration=Math.max(forbiddenPenetration,-c.distance);
    }
    const position=Array.from(d.xpos.slice(r.egg*3,r.egg*3+3));
    const tcp=Array.from(d.site_xpos.slice(r.site*3,r.site*3+3));
    const neighborDisplacement=Math.max(0,...r.eggs.slice(1).map((id,i)=>Math.hypot(...Array.from(d.xpos.slice(id*3,id*3+3)).map((v,j)=>v-initial.current[i+1][j]))));
    return {bilateral:r.fingers.every(id=>touching.has(id)),fingerContacts:r.fingers.filter(id=>touching.has(id)).length,aperture:r.jawQa.reduce((s,i)=>s+d.qpos[i],0),
      tcpDistance:Math.hypot(...position.map((v,i)=>v-tcp[i])),lift:position[2]-eggStartHeight.current,
      traySupported,tiltDegrees:Math.acos(Math.max(-1,Math.min(1,(d.xmat as Float64Array)[r.egg*9+8])))*180/Math.PI,
      cellError:Math.hypot(position[0]-plan.current!.cell[0],position[1]-plan.current!.cell[1]),
      speed:Math.hypot(...Array.from(d.qvel.slice(r.eggDof,r.eggDof+3))),forbiddenPenetration,gripPenetration,neighborDisplacement};
  }

  useBeforePhysicsStep((m,d)=>{
    const loaded=plan.current;
    if(!loaded)return;
    let p:EggMotionPlan=loaded;
    // Native Reset runs before React effects. Stop here, before any old command
    // or contact check can run against the newly reset physics state.
    if(active.current&&didEggClockReset(previousPhysicsTime.current,d.time)) {
      active.current=false;startTime.current=null;lastRequest.current=requestId;
      phaseIndex.current=0;ids.current=null;lostSince.current=null;history.current=[];
      publish({phase:'ready',label:'Ready · Arm 1 / one ivory egg',phaseIndex:0});
    }
    previousPhysicsTime.current=d.time;
    if(requestId>lastRequest.current) {
      lastRequest.current=requestId;
      const selected=plans.current[program];
      if(!selected){publish({phase:'error',label:'Requested motion is not loaded',phaseIndex:0});return;}
      p=selected;plan.current=p;
      const joints=Array.from({length:7},(_,i)=>findJointByName(m,`r0_joint${i+1}`));
      const egg=findBodyByName(m,p.egg),site=findSiteByName(m,'r0_tcp');
      const fingers=['r0_left_finger','r0_right_finger'].map(n=>findBodyByName(m,n));
      if(joints.some(i=>i<0)||egg<0||site<0||fingers.some(i=>i<0)) {publish({phase:'error',label:'Model names do not match motion',phaseIndex:0});return;}
      const qa=joints.map(i=>m.jnt_qposadr[i]);
      const allAtHome=Array.from({length:4},(_,arm)=>Array.from({length:7},(_,j)=>{
        const joint=findJointByName(m,`r${arm}_joint${j+1}`);
        return joint>=0&&Math.abs(d.qpos[m.jnt_qposadr[joint]]-p.initialJoints[j])<=.025;
      }).every(Boolean)).every(Boolean);
      if(!allAtHome) {
        publish({phase:'error',label:'Reset before running the checked path',phaseIndex:0});return;
      }
      const eggs=Array.from({length:16},(_,i)=>findBodyByName(m,`egg_${i}`));
      const robotBodies=new Set<number>();
      // Resolve actual robot descendants instead of relying on static body order.
      const roots=Array.from({length:4},(_,i)=>findBodyByName(m,`r${i}_link0`));
      for(let i=0;i<m.nbody;i++){let ancestor=i;while(ancestor>0&&!roots.includes(ancestor))ancestor=m.body_parentid[ancestor];if(roots.includes(ancestor))robotBodies.add(i);}
      ids.current={qa,da:joints.map(i=>m.jnt_dofadr[i]),egg,site,fingers,tray:findBodyByName(m,'output_tray_0'),
        source:Array.from({length:4},(_,i)=>findBodyByName(m,`source_insert_${i}`)),
        jawQa:[1,2].map(i=>m.jnt_qposadr[findJointByName(m,`r0_finger_joint${i}`)]),
        eggDof:m.jnt_dofadr[findJointByName(m,'egg_0_free')],eggs,robotBodies};
      initial.current=eggs.map(id=>Array.from(d.xpos.slice(id*3,id*3+3)));
      eggStartHeight.current=d.xpos[egg*3+2];
      if(initial.current.some((position,eggIndex)=>Math.hypot(...position.map((v,i)=>v-p.initialEggPositions[eggIndex][i]))>.004)) {publish({phase:'error',label:'An egg has moved · Reset required',phaseIndex:0});return;}
      active.current=true;phaseIndex.current=0;startTime.current=d.time;startGrip.current=255;history.current=[];
      publish({phase:'running',label:p.phases[0].name,phaseIndex:0});
    }
    if(!active.current||!ids.current||startTime.current===null)return;
    const i=phaseIndex.current,phase=p.phases[i],elapsed=d.time-startTime.current;
    const command=sampleEggPhase(phase,elapsed/phase.duration,startGrip.current);
    const r=ids.current;
    for(let j=0;j<7;j++) d.ctrl[j]=command.joints[j]+d.qfrc_bias[r.da[j]]/m.actuator_gainprm[j*10];
    d.ctrl[7]=command.gripper;
    const o=observe(m,d);
    window.eggTransfer={state:state.current,observation:o,history:history.current};
    const fail=(reason:string)=>{
      active.current=false;
      for(let j=0;j<7;j++)d.ctrl[j]=d.qpos[r.qa[j]]+d.qfrc_bias[r.da[j]]/m.actuator_gainprm[j*10];
      publish({phase:'error',label:`Stopped · ${phase.name}`,reason,phaseIndex:i},o);
    };
    const safety=checkEggGate(null,o);
    if(safety){fail(safety);return;}
    // Grip continuity after closure and before supported release. A brief
    // contact-manifold change is allowed, not an airborne object following TCP.
    if((phase.gate==='carried'||phase.gate==='supported')&&(!o.bilateral||o.tcpDistance>.065)) {
      lostSince.current??=d.time;
      if(d.time-lostSince.current>.12){fail('lost-physical-grasp');return;}
    } else lostSince.current=null;
    if(elapsed>=phase.duration) {
      const reason=checkEggGate(phase.gate,o);
      if(reason){if(elapsed>phase.duration+1.5)fail(reason);return;}
      if(phase.gate==='tilted'&&p.inspection&&!isEggInspectionMatch(p.inspection,
        Array.from(d.xpos.slice(r.egg*3,r.egg*3+3)),Array.from(d.xquat.slice(r.egg*4,r.egg*4+4)))) {
        fail('outside-checked-regrasp-pose');return;
      }
      history.current.push({phase:phase.name,time:d.time,observation:o});
      if(i===p.phases.length-1){active.current=false;publish({phase:'complete',label:p.program==='reseat'?'Egg corrected and reseated · Arm 1 returned':'One ivory egg placed · Arm 1 returned',phaseIndex:i},o);return;}
      phaseIndex.current++;startTime.current=d.time;startGrip.current=phase.gripper;
      publish({phase:'running',label:p.phases[i+1].name,phaseIndex:i+1},o);
    }
  });
  return null;
}
