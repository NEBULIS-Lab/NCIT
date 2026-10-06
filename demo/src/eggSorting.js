import {sampleEggPhase,checkEggGate} from './eggTransfer.js';
const HOME=[1.570796,-.785398,0,-2.356194,0,1.570796,.785398];
export function sortingLocksControls(state) {
  return state.phase==='running'||(state.phase==='error'&&state.failureSource==='runtime');
}

export function isSortingTrayLoadBearing(o) {
  return o.traySupported&&o.fingerContacts>=1&&o.cellError<=.003&&o.tiltDegrees<=20&&o.speed<=.008;
}

export function checkSortingGate(gate,o) {
  if(gate!=='supported')return checkEggGate(gate,o);
  const safety=checkEggGate(null,o);if(safety)return safety;
  // On landing the tray takes the load, and one jaw may cease touching.
  // In-flight gates still require both real finger contacts without exception.
  if(!o.traySupported)return 'missing-tray-support';
  if(!isSortingTrayLoadBearing(o))return 'tray-load-transfer-not-stable';
  if(o.aperture<.028||o.aperture>.070||o.tcpDistance>.065)return 'invalid-landing-grasp';
  return null;
}

/** Deterministic whole-path reservation: conflicting requests remain queued. */
export function reserveBatch(pending,conflicts) {
  const running=[],waiting=[];
  for(const arm of pending) {
    const blocked=running.some(other=>conflicts.some(([a,b])=>(a===arm&&b===other)||(a===other&&b===arm)));
    (blocked?waiting:running).push(arm);
  }
  return {running,waiting};
}

export function sourcePathsConflict(a,b) {
  const near=t=>(Math.floor(t.eggIndex/4)-t.arm+4)%4<=1;
  return !(near(a)&&near(b)&&Math.abs(a.arm-b.arm)===2&&Math.abs(Math.floor(a.eggIndex/4)-Math.floor(b.eggIndex/4))===2);
}

export function sourceLeaseEnd(t) {
  return t.start+t.phases.slice(0,5).reduce((sum,p)=>sum+p.duration,0);
}

export function sourceReservationsValid(tasks) {
  for(const t of tasks) {
    const active=tasks.flatMap((q,i)=>q.start<=t.start&&sourceLeaseEnd(q)>t.start+1e-9?[i]:[]);
    const conflicts=active.flatMap((i,k)=>active.slice(k+1).flatMap(j=>sourcePathsConflict(tasks[i],tasks[j])?[[i,j]]:[]));
    if(reserveBatch(active,conflicts).waiting.length)return false;
  }
  return true;
}

export function isValidSortingPlan(p) {
  const vector=(v,n)=>Array.isArray(v)&&v.length===n&&v.every(Number.isFinite);
  if(!p||p.schemaVersion!==1||p.program!=='sorting'||p.success!==true||!vector(p.initialJoints,7)
    ||!Array.isArray(p.initialEggPositions)||p.initialEggPositions.length!==16||!p.initialEggPositions.every(v=>vector(v,3))
    ||!Array.isArray(p.tasks)||!p.tasks.length||p.tasks.length>16||!vector(p.counts,4)||!Number.isFinite(p.duration)
    ||p.initialJoints.some((v,j)=>Math.abs(v-HOME[j])>1e-6))return false;
  const eggs=new Set(),cells=new Set(),counts=[0,0,0,0],intervals=[[],[],[],[]];let end=0;
  const gates=[null,null,'bilateral','carried','carried','carried','supported','released',null,null,'seated'];
  for(const t of p.tasks) {
    if(!t||!Number.isInteger(t.arm)||t.arm<0||t.arm>3||t.classIndex!==t.arm||!Number.isInteger(t.eggIndex)||t.eggIndex<0||t.eggIndex>15
      ||(t.eggIndex%4+Math.floor(t.eggIndex/4))%4!==t.arm||eggs.has(t.eggIndex)
      ||!Number.isInteger(t.cellIndex)||t.cellIndex<0||t.cellIndex>3||cells.has(`${t.arm}:${t.cellIndex}`)
      ||!vector(t.cell,3)||!Number.isFinite(t.start)||t.start<0||!Array.isArray(t.phases)||t.phases.length!==11)return false;
    const [x,y]=[[-.442,-.442],[-.358,-.442],[-.442,-.358],[-.358,-.358]][t.cellIndex];
    const c=Math.cos(t.arm*Math.PI/2),s=Math.sin(t.arm*Math.PI/2);
    if(Math.hypot(t.cell[0]-(c*x-s*y),t.cell[1]-(s*x+c*y))>1e-5||t.cell[2]<.13||t.cell[2]>.16)return false;
    let previous=p.initialJoints,duration=0;
    for(const [i,s] of t.phases.entries()) {
      if(!s||typeof s.name!=='string'||!Number.isFinite(s.duration)||s.duration<=0||s.gate!==gates[i]
        ||!Number.isFinite(s.gripper)||s.gripper<0||s.gripper>255||!Array.isArray(s.path)||s.path.length<2
        ||!s.path.every(q=>vector(q,7))||s.path[0].some((v,j)=>Math.abs(v-previous[j])>1e-6))return false;
      duration+=s.duration;previous=s.path.at(-1);
    }
    if(previous.some((v,j)=>Math.abs(v-p.initialJoints[j])>1e-6))return false;
    if(intervals[t.arm].some(([a,b])=>t.start<b-1e-9&&t.start+duration>a+1e-9))return false;
    if(intervals[t.arm].length&&t.start<intervals[t.arm].at(-1)[0])return false;
    intervals[t.arm].push([t.start,t.start+duration]);end=Math.max(end,t.start+duration);
    eggs.add(t.eggIndex);cells.add(`${t.arm}:${t.cellIndex}`);counts[t.arm]++;
  }
  return Math.abs(p.duration-end)<1e-6&&counts.every((n,a)=>n===p.counts[a])&&sourceReservationsValid(p.tasks);
}

/** Contact checks need only the stage, not interpolated joint targets. */
export function sortingStageAt(task,time) {
  let local=time-task.start;
  if(local<-1e-9)return -1;
  local=Math.max(0,local);
  for(let stage=0;stage<task.phases.length;stage++){
    const duration=task.phases[stage].duration;
    if(local<=duration+1e-9||stage===task.phases.length-1)return stage;
    local-=duration;
  }
  return -1;
}

export function sampleSortingTask(task,time) {
  let local=time-task.start,startGripper=255;
  if(local<-1e-9)return null;
  local=Math.max(0,local);
  for(const [stage,p] of task.phases.entries()) {
    if(local<=p.duration+1e-9||stage===task.phases.length-1)
      return {...sampleEggPhase(p,local/p.duration,startGripper),stage};
    local-=p.duration;startGripper=p.gripper;
  }
  return null;
}

export function sortingEvents(plan) {
  return plan.tasks.flatMap((task,taskIndex)=>{
    let time=task.start;
    return task.phases.map((phase,stage)=>({time:time+=phase.duration,taskIndex,stage}));
  }).sort((a,b)=>a.time-b.time||a.taskIndex-b.taskIndex);
}
