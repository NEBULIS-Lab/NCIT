import {isValidSortingPlan,sampleSortingTask,sortingStageAt,sortingEvents,checkSortingGate,isSortingTrayLoadBearing} from './eggSorting.js';
import {didEggClockReset} from './eggTransfer.js';
import {consumeMujocoContacts} from './mujocoContact.js';

/** Shared by React and the real-WASM test: never writes object/joint state. */
export class EggSortingRuntime {
  constructor(plan,find) {
    if(!isValidSortingPlan(plan))throw new Error('Invalid sorting motion asset');
    this.plan=plan;this.find=find;this.events=sortingEvents(plan);this.reset();
  }
  reset() {
    this.state={phase:'ready',label:'Ready · four-arm sorting',counts:[0,0,0,0],arms:Array(4).fill('Ready')};
    this.time=0;this.cursor=0;this.previous=null;this.history=[];this.done=new Set();this.loss=[null,null,null,null];
    this.metrics={maxForbiddenPenetration:0,maxGripPenetration:0,maxNeighborDisplacement:0,parallelSeconds:0,maxSimultaneousArms:0};
    this.observations=[];this.holdSince=null;this.refs=null;
  }
  start(m,d) {
    try {this.initialize(m,d);}catch(error){this.fail(`startup-exception: ${String(error)}`);}
  }
  initialize(m,d) {
    this.reset();const f=this.find,p=this.plan;
    const joints=Array.from({length:4},(_,a)=>Array.from({length:7},(_,j)=>f.joint(`r${a}_joint${j+1}`)));
    const roots=Array.from({length:4},(_,a)=>f.body(`r${a}_link0`));
    const eggs=Array.from({length:16},(_,i)=>f.body(`egg_${i}`));
    const sites=Array.from({length:4},(_,a)=>f.site(`r${a}_tcp`));
    const fingers=Array.from({length:4},(_,a)=>['left','right'].map(s=>f.body(`r${a}_${s}_finger`)));
    const trays=Array.from({length:4},(_,a)=>f.body(`output_tray_${a}`));
    const source=Array.from({length:4},(_,a)=>f.body(`source_insert_${a}`));
    const eggJoints=Array.from({length:16},(_,i)=>f.joint(`egg_${i}_free`));
    const jawJoints=Array.from({length:4},(_,a)=>[1,2].map(j=>f.joint(`r${a}_finger_joint${j}`)));
    if([...joints.flat(),...roots,...eggs,...sites,...fingers.flat(),...trays,...source,...eggJoints,...jawJoints.flat()].some(i=>i<0)){
      this.fail('model-name-mismatch');return;
    }
    const qa=joints.map(row=>row.map(j=>m.jnt_qposadr[j])),da=joints.map(row=>row.map(j=>m.jnt_dofadr[j]));
    if(qa.some(row=>row.some((q,j)=>Math.abs(d.qpos[q]-p.initialJoints[j])>.025))){this.fail('reset-required-arms');return;}
    if(jawJoints.flat().some(j=>Math.abs(d.qpos[m.jnt_qposadr[j]]-.05)>.003)){this.fail('reset-required-grippers');return;}
    this.initial=eggs.map(id=>Array.from(d.xpos.slice(id*3,id*3+3)));
    if(this.initial.some((pos,i)=>Math.hypot(...pos.map((v,j)=>v-p.initialEggPositions[i][j]))>.004)){this.fail('reset-required-eggs');return;}
    const robots=new Set();
    for(let i=1;i<m.nbody;i++){let a=i;while(a>0&&!roots.includes(a))a=m.body_parentid[a];if(roots.includes(a))robots.add(i);}
    this.refs={qa,da,eggs,sites,fingers,trays,source,robots,eggDof:eggJoints.map(j=>m.jnt_dofadr[j]),jaws:jawJoints.map(row=>row.map(j=>m.jnt_qposadr[j]))};
    this.previous=d.time;this.state={...this.state,phase:'running',label:'Sorting 0 / 16'};
    this.lastQ=Array.from({length:4},()=>[...p.initialJoints]);
  }
  fail(reason) {this.state={...this.state,phase:'error',failureSource:'runtime',label:'Sorting stopped',reason};}
  taskAt(arm) {
    return this.plan.tasks.findIndex((t,i)=>t.arm===arm&&!this.done.has(i)&&t.start<=this.time+1e-9);
  }
  observe(m,d) {
    const r=this.refs,p=this.plan;
    const contacts=consumeMujocoContacts(d.contact,d.ncon),touching=r.eggs.map(()=>new Set());
    const eggIndex=new Map(r.eggs.map((id,i)=>[id,i]));
    const supports=r.eggs.map(()=>new Set(r.source));
    const current=[];
    for(const [i,t] of p.tasks.entries()){
      if(this.done.has(i))supports[t.eggIndex]=new Set([r.trays[t.arm]]);
      else if(t.start<=this.time+1e-9){
        const stage=sortingStageAt(t,this.time);
        current.push({taskIndex:i,task:t,stage});
        supports[t.eggIndex]=new Set([...(stage<=3?r.source:stage>=6?[r.trays[t.arm]]:[]),...r.fingers[t.arm]]);
      }
    }
    let forbidden=0,grip=0,worst=null;
    for(const c of contacts){
      if(c.distance>0)continue;
      const a=m.geom_bodyid[c.geom1],b=m.geom_bodyid[c.geom2],ea=eggIndex.get(a),eb=eggIndex.get(b);
      let bad=r.robots.has(a)||r.robots.has(b);
      if(ea!==undefined){touching[ea].add(b);bad=!supports[ea].has(b);}
      if(eb!==undefined){touching[eb].add(a);bad=(ea!==undefined&&bad)||!supports[eb].has(a);}
      if(bad&&-c.distance>forbidden){forbidden=-c.distance;worst=[a,b];}
      if(!bad&&(r.robots.has(a)||r.robots.has(b)))grip=Math.max(grip,-c.distance);
    }
    const moved=new Set([...current.map(c=>c.task.eggIndex),...[...this.done].map(i=>p.tasks[i].eggIndex)]);
    const neighbor=Math.max(0,...r.eggs.flatMap((id,i)=>moved.has(i)?[]:[Math.hypot(...Array.from(d.xpos.slice(id*3,id*3+3)).map((v,j)=>v-this.initial[i][j]))]));
    this.metrics.maxForbiddenPenetration=Math.max(this.metrics.maxForbiddenPenetration,forbidden);
    this.metrics.maxGripPenetration=Math.max(this.metrics.maxGripPenetration,grip);
    this.metrics.maxNeighborDisplacement=Math.max(this.metrics.maxNeighborDisplacement,neighbor);
    if(worst)this.metrics.worstContact=worst;
    this.observations=p.tasks.map(t=>{
      const e=t.eggIndex,a=t.arm,id=r.eggs[e],pos=Array.from(d.xpos.slice(id*3,id*3+3)),site=r.sites[a];
      return {bilateral:r.fingers[a].every(i=>touching[e].has(i)),fingerContacts:r.fingers[a].filter(i=>touching[e].has(i)).length,
        traySupported:touching[e].has(r.trays[a]),lift:pos[2]-this.initial[e][2],
        tiltDegrees:Math.acos(Math.max(-1,Math.min(1,d.xmat[id*9+8])))*180/Math.PI,
        cellError:Math.hypot(pos[0]-t.cell[0],pos[1]-t.cell[1]),speed:Math.hypot(...d.qvel.slice(r.eggDof[e],r.eggDof[e]+3)),
        tcpDistance:Math.hypot(...pos.map((v,j)=>v-d.site_xpos[site*3+j])),aperture:r.jaws[a].reduce((s,j)=>s+d.qpos[j],0),
        forbiddenPenetration:forbidden,gripPenetration:grip,neighborDisplacement:neighbor};
    });
    return current;
  }
  step(m,d) {
    const wasRunning=this.state.phase==='running';
    try {this.advance(m,d);}catch(error){this.fail(`runtime-exception: ${String(error)}`);}
    if(wasRunning&&this.state.phase==='error'&&this.refs&&Array.from(d.qpos).every(Number.isFinite)){
      // Stop through actuator targets, retaining the physical grip. No qpos
      // assignment, weld, gravity disable or forced object following.
      for(let a=0;a<4;a++)for(let j=0;j<7;j++)d.ctrl[a*8+j]=d.qpos[this.refs.qa[a][j]]+d.qfrc_bias[this.refs.da[a][j]]/m.actuator_gainprm[(a*8+j)*10];
    }
  }
  advance(m,d) {
    if(this.state.phase!=='running'||!this.refs)return;
    if(didEggClockReset(this.previous,d.time)){this.reset();return;}
    const dt=Math.max(0,d.time-this.previous);this.previous=d.time;
    if(!Array.from(d.qpos).every(Number.isFinite)){this.fail('non-finite-state');return;}
    const current=this.observe(m,d);
    const safety=checkSortingGate(null,this.observations[0]);
    if(safety){this.fail(safety);return;}
    for(const c of current){
      const gate=c.task.phases[c.stage].gate,o=this.observations[c.taskIndex],a=c.task.arm;
      if((gate==='carried'||(gate==='supported'&&!isSortingTrayLoadBearing(o)))&&(!o.bilateral||o.tcpDistance>.065)){
        this.loss[a]??=d.time;if(d.time-this.loss[a]>.12){this.fail(`Arm ${a+1}: lost-physical-grasp`);return;}
      }else this.loss[a]=null;
    }
    let counts=this.state.counts;
    while(this.cursor<this.events.length&&this.events[this.cursor].time<=this.time+1e-9){
      const e=this.events[this.cursor],t=this.plan.tasks[e.taskIndex],o=this.observations[e.taskIndex];
      const reason=checkSortingGate(t.phases[e.stage].gate,o);
      // The exported path already contains checked settling dwells. Extending
      // one here would invalidate other arms' corridor leases. A failed gate
      // is a safety stop, never a global adaptive wait disguised as scheduling.
      if(reason){this.fail(`Arm ${t.arm+1}: ${reason}`);return;}
      this.holdSince=null;this.history.push({...e,arm:t.arm,egg:t.eggIndex,observation:o});
      if(e.stage===10){this.done.add(e.taskIndex);counts=[...counts];counts[t.arm]++;}
      this.cursor++;
    }
    if(this.state.phase==='error')return;
    if(this.cursor===this.events.length){
      for(const o of this.observations){const reason=checkSortingGate('seated',o);if(reason){this.fail(`Final: ${reason}`);return;}}
      this.state={...this.state,counts,phase:'complete',label:`Sorted ${this.plan.tasks.length} / ${this.plan.tasks.length} · all arms returned`,arms:Array(4).fill('Complete')};return;
    }
    this.time=Math.min(this.time+dt,this.events[this.cursor].time);
    let moving=0;const labels=[];
    for(let a=0;a<4;a++){
      const i=this.taskAt(a),task=this.plan.tasks[i],sample=task?sampleSortingTask(task,this.time):null;
      const q=sample?.joints??this.plan.initialJoints;
      if(Math.hypot(...q.map((v,j)=>v-this.lastQ[a][j]))>1e-8)moving++;
      for(let j=0;j<7;j++)d.ctrl[a*8+j]=q[j]+d.qfrc_bias[this.refs.da[a][j]]/m.actuator_gainprm[(a*8+j)*10];
      d.ctrl[a*8+7]=sample?.gripper??255;this.lastQ[a]=q;
      labels.push(task?task.phases[sample.stage].name:this.plan.tasks.some((t,i)=>t.arm===a&&!this.done.has(i))?'Waiting · shared path':'Complete');
    }
    if(moving>=2)this.metrics.parallelSeconds+=dt;
    this.metrics.maxSimultaneousArms=Math.max(this.metrics.maxSimultaneousArms,moving);
    const label=`Sorting ${counts.reduce((a,b)=>a+b,0)} / ${this.plan.tasks.length}`;
    // UI snapshots change only at task/phase transitions. Physics, contact
    // observations, metrics and safety gates still run on every tick.
    if(counts!==this.state.counts||label!==this.state.label||labels.some((s,a)=>s!==this.state.arms[a]))
      this.state={...this.state,counts,arms:labels,label};
  }
}
