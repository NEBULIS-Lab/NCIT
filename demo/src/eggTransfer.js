/** Isolated Demo2 rules. No Assembly state or physics settings are shared. */
export function didEggClockReset(previous,current) {
  return previous!==null&&current<previous-1e-6;
}

/** The trial uses a checked trajectory, not arbitrary-pose online recovery. */
export function isEggInspectionMatch(expected,position,quaternion) {
  const distance=Math.hypot(...position.map((v,i)=>v-expected.position[i]));
  const dot=Math.abs(quaternion.reduce((sum,v,i)=>sum+v*expected.quaternion[i],0));
  const angle=2*Math.acos(Math.min(1,dot));
  return Number.isFinite(distance)&&Number.isFinite(angle)&&distance<=.004&&angle<=5*Math.PI/180;
}

export function isValidEggPlan(p) {
  const vector=(v,n)=>Array.isArray(v)&&v.length===n&&v.every(Number.isFinite);
  const reseat=p?.schemaVersion===2&&p.program==='reseat';
  const gates=reseat?[null,null,'bilateral','carried','carried','carried','supported','released',null,'tilted',null,null,'bilateral','carried','carried','supported','released',null,null,'seated']:
    [null,null,'bilateral','carried','carried','carried','supported','released',null,null,'seated'];
  return !!p&&((p.schemaVersion===1&&p.program===undefined)||reseat)&&p.success===true&&p.arm===0&&p.egg==='egg_0'
    &&(!reseat||(p.inspection?.phaseIndex===9&&vector(p.inspection.position,3)&&vector(p.inspection.quaternion,4)
      &&Math.abs(Math.hypot(...p.inspection.quaternion)-1)<1e-6&&p.inspection.tiltDegrees>20&&p.inspection.tiltDegrees<45))
    &&vector(p.initialJoints,7)&&p.initialGripper===255&&vector(p.cell,3)
    &&Array.isArray(p.initialEggPositions)&&p.initialEggPositions.length===16&&p.initialEggPositions.every(v=>vector(v,3))
    &&Array.isArray(p.phases)&&p.phases.length===gates.length&&p.phases.every((s,i)=>s&&typeof s.name==='string'
      &&Number.isFinite(s.duration)&&s.duration>0&&Number.isFinite(s.gripper)&&s.gripper>=0&&s.gripper<=255
      &&s.gate===gates[i]
      &&Array.isArray(s.path)&&s.path.length>=2&&s.path.every(q=>vector(q,7)))
    &&p.phases.every((s,i)=>s.path[0].every((q,j)=>Math.abs(q-(i?p.phases[i-1].path.at(-1)[j]:p.initialJoints[j]))<1e-6))
    &&p.phases.at(-1).path.at(-1).every((q,j)=>Math.abs(q-p.initialJoints[j])<1e-6);
}

export function isForbiddenEggContact(a,b,{robotBodies,fingers,egg,allowedSupports}) {
  if(a===egg||b===egg) {
    const other=a===egg?b:a;
    return !fingers.includes(other)&&!allowedSupports.has(other);
  }
  return robotBodies.has(a)||robotBodies.has(b);
}

export function sampleEggPhase(phase, progress, startGripper) {
  const t = Math.max(0, Math.min(1, progress));
  const s = t*t*t*(10+t*(-15+6*t));
  const index = Math.min(Math.floor(s*(phase.path.length-1)), phase.path.length-2);
  const fraction = s*(phase.path.length-1)-index;
  return {
    joints: phase.path[index].map((q,j)=>q+(phase.path[index+1][j]-q)*fraction),
    gripper: startGripper+(phase.gripper-startGripper)*s,
  };
}

export function checkEggGate(gate, observation) {
  const o = observation;
  if (![o.aperture,o.tcpDistance,o.lift,o.cellError,o.tiltDegrees,o.speed,
    o.forbiddenPenetration,o.gripPenetration,o.neighborDisplacement].every(Number.isFinite)) return 'non-finite-state';
  if (o.gripPenetration > .001) return 'excessive-grip-penetration';
  if (o.forbiddenPenetration > .0001) return 'unexpected-collision';
  if (o.neighborDisplacement > .002) return 'neighbor-disturbed';
  if (gate === 'bilateral' || gate === 'carried' || gate === 'supported') {
    if (!o.bilateral) return 'missing-two-sided-contact';
    if (o.aperture < .028 || o.aperture > .070) return 'invalid-grip-aperture';
    if (o.tcpDistance > .065) return 'egg-not-carried';
  }
  if (gate === 'carried' && o.lift < .060) return 'insufficient-lift';
  if (gate === 'supported' || gate === 'seated' || gate === 'released' || gate === 'tilted') {
    if (!o.traySupported) return 'missing-tray-support';
  }
  if ((gate === 'released' || gate === 'seated' || gate === 'tilted') && o.fingerContacts !== 0) return 'egg-not-released';
  if (gate === 'tilted') {
    if(o.cellError>.012||o.tiltDegrees>=45)return 'outside-correction-envelope';
    if(o.speed>.008)return 'egg-not-settled';
    if(o.tiltDegrees<=20)return 'correction-not-needed';
  }
  if (gate === 'seated') {
    if (o.bilateral) return 'egg-not-released';
    if (o.cellError > .012) return 'wrong-tray-cell';
    if (o.tiltDegrees > 20) return 'egg-not-upright';
    if (o.speed > .008) return 'egg-not-settled';
  }
  return null;
}
