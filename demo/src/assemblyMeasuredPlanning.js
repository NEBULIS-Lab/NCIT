import * as THREE from 'three';
import { solveSelectedIk, fitJointAngleToRange } from './controllers/selectedIkSolver.js';
import { topDownTcpQuaternion } from './assemblyStep1.js';
import { ASSEMBLY1_STEP4_HANDOVER_TCP_QUATERNIONS } from './assemblyStep4.js';

function named(model, kind, name) {
  const count=model[`n${kind}`], adr=model[`name_${kind}adr`];
  for(let id=0;id<count;id++) {let s='';for(let p=adr[id];model.names[p];p++)s+=String.fromCharCode(model.names[p]);if(s===name)return id;}
  throw new Error(`Missing ${kind}: ${name}`);
}
function quat(values,id) {return new THREE.Quaternion(values[id*4+1],values[id*4+2],values[id*4+3],values[id*4]);}
function bodyPose(model,data,name) {const id=named(model,'body',name);return {p:new THREE.Vector3(...data.xpos.slice(id*3,id*3+3)),q:quat(data.xquat,id)};}
function sitePose(model,data,name) {
  const id=named(model,'site',name),a=data.site_xmat.slice(id*9,id*9+9);
  return {p:new THREE.Vector3(...data.site_xpos.slice(id*3,id*3+3)),q:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(a[0],a[1],a[2],0,a[3],a[4],a[5],0,a[6],a[7],a[8],0,0,0,0,1))};
}
export function actualInsertionGeometry(model,data) {
  const beam=bodyPose(model,data,'cross_member');
  const pin=bodyPose(model,data,'fastener_1');
  const axis=new THREE.Vector3(0,0,1).applyQuaternion(beam.q);
  const hole=new THREE.Vector3(-.038,.215,.048).applyQuaternion(beam.q).add(beam.p);
  const tip=new THREE.Vector3(0,0,-.025).applyQuaternion(pin.q).add(pin.p);
  const d=tip.clone().sub(hole),depth=-d.dot(axis);
  const radial=d.clone().addScaledVector(axis,depth).length();
  const pinAxis=new THREE.Vector3(0,0,1).applyQuaternion(pin.q);
  return {hole,axis,depth,radial,tilt:Math.acos(Math.min(1,Math.max(-1,pinAxis.dot(axis))))*180/Math.PI};
}

// All IK runs against a disposable kinematics-only scratch state. It never
// changes the simulation's object poses, velocities, contacts or constraints.
export function planMeasuredAssemblyPhase(mujoco,model,data,phase,plans) {
  const scratch=new mujoco.MjData(model);scratch.qpos.set(data.qpos);
  const kinematics={mj_forward:(m,d)=>mujoco.mj_kinematics(m,d)};
  function path(index,waypoints,prefix=[]) {
    const key=`r${index}`,siteId=named(model,'site',`${key}_tcp`);
    const ids=Array.from({length:7},(_,j)=>named(model,'jnt',`${key}_joint${j+1}`));
    const addresses=ids.map(id=>model.jnt_qposadr[id]);
    let current=addresses.map(a=>data.qpos[a]);
    const points=[current,...prefix.map(q=>[...q])],start=sitePose(model,data,`${key}_tcp`);
    let previous=start;
    if(prefix.length) {
      current=[...prefix.at(-1)];addresses.forEach((a,j)=>{scratch.qpos[a]=current[j];});mujoco.mj_kinematics(model,scratch);
      previous=sitePose(model,scratch,`${key}_tcp`);
    }
    for(const target of waypoints) {
      const count=Math.max(2,Math.ceil(previous.p.distanceTo(target.p)/.025),Math.ceil(previous.q.angleTo(target.q)/.12));
      for(let i=1;i<=count;i++) {
        const t=i/count,p=previous.p.clone().lerp(target.p,t),q=previous.q.clone().slerp(target.q,t);
        const bounded=phase.startsWith('hammer-');
        const solution=solveSelectedIk({mujoco:kinematics,model,data:scratch,siteId,qposAddresses:addresses,currentQ:current,targetPosition:p,targetQuaternion:q,maxIterations:bounded?250:100,damping:.002,tolerance:.00015,...bounded?{jointRanges:ids.map(id=>[model.jnt_range[id*2],model.jnt_range[id*2+1]])}:{}});
        if(!solution)throw new Error(`${key} no IK solution`);
        current=solution.map((v,j)=>fitJointAngleToRange(v,model.jnt_range[ids[j]*2],model.jnt_range[ids[j]*2+1]));
        addresses.forEach((a,j)=>{scratch.qpos[a]=current[j];});mujoco.mj_kinematics(model,scratch);
        const actual=sitePose(model,scratch,`${key}_tcp`);
        if(actual.p.distanceTo(p)>.004 || actual.q.angleTo(q)>.08)throw new Error(`${key}/${phase} unreachable: ${actual.p.distanceTo(p).toFixed(4)}m/${(actual.q.angleTo(q)*180/Math.PI).toFixed(1)}deg at ${i}/${count} q=${current.map(v=>v.toFixed(2)).join(',')}`);
        points.push(current);
      }
      previous=target;
    }
    plans[index].phasePaths??={};plans[index].phasePaths[phase]=points;
    return points.at(-1);
  }
  function heldTarget(index,bodyName,bodyQuaternion,worldPoint,bodyLocalPoint) {
    const body=bodyPose(model,data,bodyName),tcp=sitePose(model,data,`r${index}_tcp`);
    const inv=body.q.clone().invert();
    const tcpLocal=tcp.p.clone().sub(body.p).applyQuaternion(inv);
    return {p:tcpLocal.sub(bodyLocalPoint).applyQuaternion(bodyQuaternion).add(worldPoint),q:bodyQuaternion.clone().multiply(inv).multiply(tcp.q)};
  }
  try {
    if(phase==='engage') {
      // Present the actual hammer level. A TCP-only outward tilt rotated the
      // object too, making the receiver approach nearly along the handle.
      // Plan from the measured grasp transform, with both wrists in reach.
      // The direct diagonal from the east pickup crosses the south support
      // wrist. Carry the real hammer north while high, then descend on the
      // exchange side of that wrist; do not rely on marginal contact clearance.
      plans[1].engage=path(1,[
        heldTarget(1,'double_face_hammer',new THREE.Quaternion(),new THREE.Vector3(.30,.08,.56),new THREE.Vector3()),
        heldTarget(1,'double_face_hammer',new THREE.Quaternion(),new THREE.Vector3(.075,.04,.33),new THREE.Vector3()),
      ]);
    }
    if(phase==='receiver-align' || phase==='dual-clamp') {
      const target=sitePose(model,data,'hammer_receiver_grasp');
      const hammer=bodyPose(model,data,'double_face_hammer');
      const y=new THREE.Vector3(0,1,0).applyQuaternion(hammer.q);
      const z=new THREE.Vector3(0,0,1).applyQuaternion(new THREE.Quaternion(...ASSEMBLY1_STEP4_HANDOVER_TCP_QUATERNIONS.r3));
      z.addScaledVector(y,-z.dot(y)).normalize();
      const x=new THREE.Vector3().crossVectors(y,z).normalize();
      target.q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));
      const symmetric=target.q.clone().multiply(new THREE.Quaternion(0,0,1,0));
      if(symmetric.angleTo(sitePose(model,data,'r3_tcp').q)<target.q.angleTo(sitePose(model,data,'r3_tcp').q))target.q=symmetric;
      target.p.add(new THREE.Vector3(0,0,-.003).applyQuaternion(target.q));
      const approach={p:target.p.clone().add(new THREE.Vector3(0,0,-.09).applyQuaternion(target.q)),q:target.q};
      const end=path(3,phase==='receiver-align'?[approach,target]:[target]);plans[3].engage=end;
    }
    if(phase==='receiver-retreat') {
      const tcp=sitePose(model,data,'r3_tcp');
      const rise={p:tcp.p.clone().add(new THREE.Vector3(-.03,0,.085)),q:tcp.q};
      const transit={p:new THREE.Vector3(-.24,-.12,.60),q:tcp.q};
      const wait={p:new THREE.Vector3(-.54,-.15,.60),q:tcp.q};
      plans[3].wait=path(3,[rise,transit,wait]);
    }
    if(phase==='fastener-tighten') {
      const pin=bodyPose(model,data,'fastener_1');
      const target={p:pin.p.clone().add(new THREE.Vector3(0,0,.035)),q:new THREE.Quaternion(...topDownTcpQuaternion(0))};
      plans[2].engage=path(2,[target]);
      delete plans[2].phasePaths[phase];
    }
    if(phase==='lift') {
      const tcp=sitePose(model,data,'r2_tcp');tcp.p.z+=.20;
      plans[2].lift=path(2,[tcp]);
    }
    if(phase==='transfer' || phase==='insert') {
      const beam=bodyPose(model,data,'cross_member'),g=actualInsertionGeometry(model,data);
      const pin=bodyPose(model,data,'fastener_1');
      const pinAxis=new THREE.Vector3(0,0,1).applyQuaternion(pin.q);
      const pinOrientation=new THREE.Quaternion().setFromUnitVectors(pinAxis,g.axis).multiply(pin.q);
      const point=g.hole.clone().addScaledVector(g.axis,phase==='transfer'?.07:-.004);
      const target=heldTarget(2,'fastener_1',pinOrientation,point,new THREE.Vector3(0,0,-.025));
      const end=path(2,[target]);
      if(phase==='transfer')plans[2].transfer=end;else plans[2].insert=end;
    }
    if(phase==='clear') {
      const tcp=sitePose(model,data,'r2_tcp');tcp.p.z+=.10;
      plans[2].clear=path(2,[tcp]);
    }
    if(phase==='support-approach') {
      const frame=bodyPose(model,data,'assembly_frame');
      for(const [index,local,yaw] of [[1,[.3175,-.13,.006],0],[2,[.16,.232,0],90]]) {
        const p=new THREE.Vector3(...local).applyQuaternion(frame.q).add(frame.p);
        const q=new THREE.Quaternion(...topDownTcpQuaternion(yaw));
        const above={p:p.clone().add(new THREE.Vector3(0,0,.10)),q};
        try {plans[index].support=path(index,[above,{p,q}]);}
        catch(firstError) {
          // Parallel fingers have an equivalent 180-degree wrist orientation.
          // Use it if the first branch meets a wrist limit; the same physical
          // rail and closing axis are preserved.
          const symmetric=q.clone().multiply(new THREE.Quaternion(0,0,1,0));
          try {plans[index].support=path(index,[{p:above.p,q:symmetric},{p,q:symmetric}]);}
          catch {throw firstError;}
        }
      }
    }
    if(phase==='hammer-stage' || phase==='hammer-strike' || phase==='hammer-recover') {
      const pin=bodyPose(model,data,'fastener_1');
      const head=new THREE.Vector3(0,0,.039).applyQuaternion(pin.q).add(pin.p);
      head.z+=phase==='hammer-strike'?-.001:.045;
      const yaws=phase==='hammer-stage'?[0,Math.PI/2,-Math.PI/2,Math.PI]:[plans[3].hammerYaw??0];
      let failure;
      const failures=[];
      for(const yaw of yaws) {
        const hammerQ=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),yaw).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2));
        const target=heldTarget(3,'double_face_hammer',hammerQ,head,new THREE.Vector3(.088,-.075,-.008));
        try {
          const transit={p:new THREE.Vector3(-.35,.08,.55),q:sitePose(model,data,'r3_tcp').q};
          const end=path(3,phase==='hammer-stage'?[transit,target]:[target]);plans[3].hammerYaw=yaw;
          if(phase==='hammer-strike')plans[3].strike=end;else plans[3].ready=end;
          failure=null;break;
        } catch(error) {failure=error;failures.push(`${yaw.toFixed(2)}: ${String(error)}`);}
      }
      if(failure)throw new Error(failures.join('; '));
    }
    if(phase==='hammer-return' || phase==='hammer-lower') {
      const target=heldTarget(3,'double_face_hammer',new THREE.Quaternion(),new THREE.Vector3(-.48,-.25,phase==='hammer-return'?.34:.223),new THREE.Vector3());
      const retreat=phase==='hammer-return'?[...(plans[3].phasePaths?.['hammer-stage']??[])].reverse():[];
      plans[3].ready=path(3,[target],retreat);
    }
    if(phase==='tool-clear') {
      const tcp=sitePose(model,data,'r3_tcp');tcp.p.z+=.12;
      plans[3].ready=path(3,[tcp]);
    }
    if(phase==='support-clear') for(let index=0;index<3;index++) {
      const tcp=sitePose(model,data,`r${index}_tcp`);tcp.p.z+=.12;
      plans[index].support=path(index,[tcp]);
    }
    if(phase==='return-home') for(let i=0;i<4;i++) {
      plans[i].returnStart=Array.from({length:7},(_,j)=>data.qpos[model.jnt_qposadr[named(model,'jnt',`r${i}_joint${j+1}`)]]);
    }
  } finally {scratch.delete();}
}
