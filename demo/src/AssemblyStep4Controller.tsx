import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import {
  findBodyByName,
  findJointByName,
  findSiteByName,
  useBeforePhysicsStep,
  useMujoco,
  useMujocoWasm,
} from 'mujoco-react';
import type { MujocoData, MujocoModel } from 'mujoco-react';
import { actualInsertionGeometry, planMeasuredAssemblyPhase } from './assemblyMeasuredPlanning.js';

import {
  consumeMujocoContacts,
  isPassiveRetainingContactGeom,
} from './mujocoContact.js';
import { ASSEMBLY1_STEP2_ARMS, quaternionAngularDistanceDegrees } from './assemblyStep2.js';
import {
  ASSEMBLY1_STEP4_ARMS,
  ASSEMBLY1_STEP4_DURATIONS,
  ASSEMBLY1_STEP4_GRIPPERS,
  ASSEMBLY1_STEP4_LIMITS,
  advanceAssemblyStep4Machine,
  createAssemblyStep4ControlFrame,
  createAssemblyStep4Machine,
  evaluateAssemblyStep4HammerHandover,
  evaluateAssemblyStep4Placement,
  evaluateAssemblyStep4Stability,
} from './assemblyStep4.js';
import type {
  AssemblyStep4ArmPlan,
  AssemblyStep4Failure,
  AssemblyStep4Machine,
  AssemblyStep4RuntimeDiagnostics,
  AssemblyStep4State,
  AssemblyStep4Verdict,
} from './assemblyStep4.js';

type AssemblyOwnership = 'manual' | 'step1' | 'step2' | 'step3' | 'step4';

const HAMMER_GRASP_GEOMS = new Set(Array.from({ length: 15 }, (_, i) => `robotwin_hammer_handle_${i}_collision`));

interface RuntimeArm {
  armKey: string;
  actuatorIndices: number[];
  gripperActuatorIndex: number;
  qposAddresses: number[];
}

interface RuntimePlan {
  gravityData: MujocoData | null;
  restoreGripperServo: (() => void) | null;
  arms: RuntimeArm[];
  armPlans: AssemblyStep4ArmPlan[];
  frameBodyId: number;
  crossMemberBodyId: number;
  fastenerBodyId: number;
  hammerBodyId: number;
  receiverSiteId: number;
  fastenerFingerQposAddresses: [number, number];
  fastenerLeftFingerBodyId: number;
  fastenerRightFingerBodyId: number;
  hammerFingerQposAddresses: [number, number];
  hammerLeftFingerBodyId: number;
  hammerRightFingerBodyId: number;
  hammerReceiverGraspSiteId: number;
  hammerReceiverTcpSiteId: number;
  frameBaseline: [number, number, number];
  crossMemberBaseline: [number, number, number];
  crossMemberBaselineQuaternion: [number, number, number, number];
}

interface AssemblyStep4ControllerProps {
  requestId: number;
  resetGeneration: number;
  step3Complete: boolean;
  ownershipRef: MutableRefObject<AssemblyOwnership>;
  diagnosticsRef: MutableRefObject<AssemblyStep4RuntimeDiagnostics | null>;
  onStateChange: (state: AssemblyStep4State) => void;
}

function vector3(values: Float64Array, index: number): [number, number, number] {
  const offset = index * 3;
  return [values[offset], values[offset + 1], values[offset + 2]];
}

function quaternion4(values: Float64Array, index: number): [number, number, number, number] {
  const offset = index * 4;
  return [values[offset], values[offset + 1], values[offset + 2], values[offset + 3]];
}

function distance(first: readonly number[], second: readonly number[]) {
  return Math.hypot(...first.map((value, index) => value - second[index]));
}

function nameAt(model: MujocoModel, address: number) {
  let name = '';
  for (let index = address; model.names[index] !== 0; index += 1) {
    name += String.fromCharCode(model.names[index]);
  }
  return name;
}

function planningFailure(code: string, detail: string): AssemblyStep4Failure {
  return { code, detail };
}

function solutionIsWithinLimits(
  model: MujocoModel,
  jointIds: number[],
  solution: readonly number[],
) {
  return solution.length === jointIds.length && solution.every((value, index) => {
    const jointId = jointIds[index];
    if (!model.jnt_limited[jointId]) return Number.isFinite(value);
    return Number.isFinite(value)
      && value >= model.jnt_range[jointId * 2]
      && value <= model.jnt_range[jointId * 2 + 1];
  });
}

function createRuntimePlan(
  model: MujocoModel,
  data: MujocoData,
): { plan: RuntimePlan | null; failure: AssemblyStep4Failure | null } {
  const frameBodyId = findBodyByName(model, 'assembly_frame');
  const crossMemberBodyId = findBodyByName(model, 'cross_member');
  const fastenerBodyId = findBodyByName(model, 'fastener_1');
  const hammerBodyId = findBodyByName(model, 'double_face_hammer');
  const receiverSiteId = findSiteByName(model, 'frame_receiver_nw');
  const hammerReceiverGraspSiteId = findSiteByName(model, 'hammer_receiver_grasp');
  const hammerReceiverTcpSiteId = findSiteByName(model, 'r3_tcp');
  const fastenerArm = ASSEMBLY1_STEP2_ARMS[2];
  const hammerArm = ASSEMBLY1_STEP2_ARMS[3];
  const fastenerFingerJointIds = fastenerArm.fingerJointNames.map(
    (name) => findJointByName(model, name),
  );
  const fastenerLeftFingerBodyId = findBodyByName(model, fastenerArm.leftFingerBody);
  const fastenerRightFingerBodyId = findBodyByName(model, fastenerArm.rightFingerBody);
  const hammerFingerJointIds = hammerArm.fingerJointNames.map(
    (name) => findJointByName(model, name),
  );
  const hammerLeftFingerBodyId = findBodyByName(model, hammerArm.leftFingerBody);
  const hammerRightFingerBodyId = findBodyByName(model, hammerArm.rightFingerBody);
  if (
    frameBodyId < 0
    || crossMemberBodyId < 0
    || fastenerBodyId < 0
    || hammerBodyId < 0
    || receiverSiteId < 0
    || hammerReceiverGraspSiteId < 0
    || hammerReceiverTcpSiteId < 0
    || fastenerFingerJointIds.some((id) => id < 0)
    || fastenerLeftFingerBodyId < 0
    || fastenerRightFingerBodyId < 0
    || hammerFingerJointIds.some((id) => id < 0)
    || hammerLeftFingerBodyId < 0
    || hammerRightFingerBodyId < 0
  ) {
    return { plan: null, failure: planningFailure('missing-resource', 'Step 4 workcell') };
  }

  const expectedGrippers = [
    ASSEMBLY1_STEP4_GRIPPERS.frame,
    ASSEMBLY1_STEP4_GRIPPERS.donorEntry,
    ASSEMBLY1_STEP4_GRIPPERS.open,
    ASSEMBLY1_STEP4_GRIPPERS.open,
  ];
  const arms: RuntimeArm[] = [];
  const armPlans: AssemblyStep4ArmPlan[] = [];
  for (const [index, arm] of ASSEMBLY1_STEP2_ARMS.entries()) {
    const contract = ASSEMBLY1_STEP4_ARMS[index];
    const jointIds = arm.jointNames.map((name) => findJointByName(model, name));
    if (
      !contract
      || contract.key !== arm.key
      || jointIds.some((id) => id < 0)
      || arm.actuatorIndices.some((actuator) => actuator < 0 || actuator >= model.nu)
      || arm.gripperActuatorIndex < 0
      || arm.gripperActuatorIndex >= model.nu
    ) {
      return { plan: null, failure: planningFailure('missing-resource', arm.key) };
    }
    if (Math.abs(data.ctrl[arm.gripperActuatorIndex] - expectedGrippers[index]) > 1e-6) {
      return { plan: null, failure: planningFailure('invalid-precondition', `${arm.key} gripper`) };
    }
    const generatedTargets = Object.values(contract.jointTargets);
    if (generatedTargets.some((target) => !solutionIsWithinLimits(model, jointIds, target))) {
      return { plan: null, failure: planningFailure('joint-limit', arm.key) };
    }
    const qposAddresses = jointIds.map((jointId) => model.jnt_qposadr[jointId]);
    const hold = index === 0 ? [...ASSEMBLY1_STEP2_ARMS[0].contactJointTargets] : qposAddresses.map((address) => data.qpos[address]);
    arms.push({
      armKey: arm.key,
      actuatorIndices: [...arm.actuatorIndices],
      gripperActuatorIndex: arm.gripperActuatorIndex,
      qposAddresses,
    });
    armPlans.push({
      armKey: arm.key,
      hold,
      prepare: contract.jointTargets.prepare,
      engage: contract.jointTargets.engage,
      lift: contract.jointTargets.lift,
      liftPath: contract.liftPathJointTargets
        ? [contract.jointTargets.engage, ...contract.liftPathJointTargets]
        : undefined,
      transfer: contract.jointTargets.transfer,
      insert: contract.jointTargets.insert,
      clear: contract.jointTargets.clear,
      ready: contract.jointTargets.ready,
      strike: contract.jointTargets.strike,
    });
  }

  return {
    plan: {
      gravityData: null,
      restoreGripperServo: null,
      arms,
      armPlans,
      frameBodyId,
      crossMemberBodyId,
      fastenerBodyId,
      hammerBodyId,
      receiverSiteId,
      fastenerFingerQposAddresses: [
        model.jnt_qposadr[fastenerFingerJointIds[0]],
        model.jnt_qposadr[fastenerFingerJointIds[1]],
      ],
      fastenerLeftFingerBodyId,
      fastenerRightFingerBodyId,
      hammerFingerQposAddresses: [
        model.jnt_qposadr[hammerFingerJointIds[0]],
        model.jnt_qposadr[hammerFingerJointIds[1]],
      ],
      hammerLeftFingerBodyId,
      hammerRightFingerBodyId,
      hammerReceiverGraspSiteId,
      hammerReceiverTcpSiteId,
      frameBaseline: vector3(data.xpos, frameBodyId),
      crossMemberBaseline: vector3(data.xpos, crossMemberBodyId),
      crossMemberBaselineQuaternion: quaternion4(data.xquat, crossMemberBodyId),
    },
    failure: null,
  };
}

function targetContacts(
  model: MujocoModel,
  data: MujocoData,
  targetBodyId: number,
  leftFingerBodyId: number,
  rightFingerBodyId: number,
  allowedTargetGeomNames: ReadonlySet<string> | null = null,
) {
  let left = false;
  let right = false;
  let leftDistance: number | null = null;
  let rightDistance: number | null = null;
  for (const contact of consumeMujocoContacts(data.contact, data.ncon)) {
    const firstBody = model.geom_bodyid[contact.geom1];
    const secondBody = model.geom_bodyid[contact.geom2];
    const targetGeomId = firstBody === targetBodyId ? contact.geom1 : contact.geom2;
    const targetGeomName = nameAt(model, model.name_geomadr[targetGeomId]);
    if (
      allowedTargetGeomNames
      && (firstBody === targetBodyId || secondBody === targetBodyId)
      && !allowedTargetGeomNames.has(targetGeomName)
    ) continue;
    if (contact.distance > 0.0001) continue;
    const passiveRetainer = isPassiveRetainingContactGeom(
      targetGeomName,
    );
    if (
      (firstBody === leftFingerBodyId && secondBody === targetBodyId)
      || (secondBody === leftFingerBodyId && firstBody === targetBodyId)
    ) {
      left = true;
      if (!passiveRetainer) {
        leftDistance = leftDistance === null
          ? contact.distance
          : Math.min(leftDistance, contact.distance);
      }
    }
    if (
      (firstBody === rightFingerBodyId && secondBody === targetBodyId)
      || (secondBody === rightFingerBodyId && firstBody === targetBodyId)
    ) {
      right = true;
      if (!passiveRetainer) {
        rightDistance = rightDistance === null
          ? contact.distance
          : Math.min(rightDistance, contact.distance);
      }
    }
  }
  return { left, right, leftDistance, rightDistance };
}

function sampleRuntime(
  model: MujocoModel,
  data: MujocoData,
  runtime: RuntimePlan,
  lastContactTimes: {
    fastener: { left: number; right: number };
    hammer: { left: number; right: number };
  },
) {
  const fastenerContacts = targetContacts(
    model,
    data,
    runtime.fastenerBodyId,
    runtime.fastenerLeftFingerBodyId,
    runtime.fastenerRightFingerBodyId,
  );
  const hammerContacts = targetContacts(
    model,
    data,
    runtime.hammerBodyId,
    runtime.hammerLeftFingerBodyId,
    runtime.hammerRightFingerBodyId,
    HAMMER_GRASP_GEOMS,
  );
  if (fastenerContacts.left) lastContactTimes.fastener.left = data.time;
  if (fastenerContacts.right) lastContactTimes.fastener.right = data.time;
  if (hammerContacts.left) lastContactTimes.hammer.left = data.time;
  if (hammerContacts.right) lastContactTimes.hammer.right = data.time;
  const frameTranslation = distance(
    vector3(data.xpos, runtime.frameBodyId),
    runtime.frameBaseline,
  );
  const crossMemberTranslation = distance(
    vector3(data.xpos, runtime.crossMemberBodyId),
    runtime.crossMemberBaseline,
  );
  const crossMemberRotationDegrees = quaternionAngularDistanceDegrees(
    quaternion4(data.xquat, runtime.crossMemberBodyId),
    runtime.crossMemberBaselineQuaternion,
  );
  const all = evaluateAssemblyStep4Stability({
    frameTranslation,
    crossMemberTranslation,
    crossMemberRotationDegrees,
  });
  const fastenerAperture = data.qpos[runtime.fastenerFingerQposAddresses[0]]
    + data.qpos[runtime.fastenerFingerQposAddresses[1]];
  let fastenerGrasp: AssemblyStep4Verdict = { ok: true };
  let fastenerCurrentGrasp: AssemblyStep4Verdict = { ok: true };
  const leftRecent = data.time - lastContactTimes.fastener.left <= ASSEMBLY1_STEP4_DURATIONS.contactGrace;
  const rightRecent = data.time - lastContactTimes.fastener.right <= ASSEMBLY1_STEP4_DURATIONS.contactGrace;
  if (!leftRecent && !rightRecent) {
    fastenerGrasp = { ok: false, code: 'missing-finger-contact', armKey: 'r2' };
  } else if (!leftRecent) {
    fastenerGrasp = { ok: false, code: 'missing-left-contact', armKey: 'r2' };
  } else if (!rightRecent) {
    fastenerGrasp = { ok: false, code: 'missing-right-contact', armKey: 'r2' };
  } else if (!(fastenerAperture > ASSEMBLY1_STEP4_LIMITS.minimumFastenerAperture)) {
    fastenerGrasp = { ok: false, code: 'empty-closure', armKey: 'r2' };
  }
  if (!fastenerContacts.left && !fastenerContacts.right) {
    fastenerCurrentGrasp = { ok: false, code: 'missing-finger-contact', armKey: 'r2' };
  } else if (!fastenerContacts.left) {
    fastenerCurrentGrasp = { ok: false, code: 'missing-left-contact', armKey: 'r2' };
  } else if (!fastenerContacts.right) {
    fastenerCurrentGrasp = { ok: false, code: 'missing-right-contact', armKey: 'r2' };
  } else if (
    [fastenerContacts.leftDistance, fastenerContacts.rightDistance]
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      .some((value) => value < -(
        ASSEMBLY1_STEP4_LIMITS.maximumContactPenetration
        + ASSEMBLY1_STEP4_LIMITS.contactComparisonEpsilon
      ))
  ) {
    fastenerCurrentGrasp = {
      ok: false,
      code: 'deep-penetration',
      armKey: 'r2',
      detail: String(Math.min(
        fastenerContacts.leftDistance ?? 0,
        fastenerContacts.rightDistance ?? 0,
      )),
    };
  } else if (!(fastenerAperture > ASSEMBLY1_STEP4_LIMITS.minimumFastenerAperture)) {
    fastenerCurrentGrasp = { ok: false, code: 'empty-closure', armKey: 'r2' };
  }
  const fastenerPosition = vector3(data.xpos, runtime.fastenerBodyId);
  const insertion = actualInsertionGeometry(model, data);
  const fastenerPlanarDistance = insertion.radial;
  const fastenerHeight = fastenerPosition[2];
  let placement = evaluateAssemblyStep4Placement({
    fastenerPlanarDistance,
    fastenerHeight,
  });
  if (insertion.radial > .004 || insertion.depth < .003 || insertion.depth > .053 || insertion.tilt > 8) {
    placement = { ok: false, code: 'shaft-not-seated', detail: `${insertion.radial.toFixed(4)}m/${insertion.depth.toFixed(4)}m/${insertion.tilt.toFixed(1)}deg` };
  }
  let hammerStrikeContact = false;
  let workpiecePenetration = 0;
  const robotCollisions: string[] = [];
  const hammerCollisions: string[] = [];
  const supportContacts = Array.from({length:3},()=>[false,false]);
  for (const contact of consumeMujocoContacts(data.contact, data.ncon)) {
    const b1 = model.geom_bodyid[contact.geom1], b2 = model.geom_bodyid[contact.geom2];
    if ([b1,b2].includes(runtime.fastenerBodyId) && [b1,b2].includes(runtime.crossMemberBodyId)) workpiecePenetration = Math.max(workpiecePenetration,-contact.distance);
    const hammerGeom = b1 === runtime.hammerBodyId ? contact.geom1 : contact.geom2;
    if ([b1,b2].includes(runtime.fastenerBodyId) && [b1,b2].includes(runtime.hammerBodyId) && nameAt(model,model.name_geomadr[hammerGeom]) === 'robotwin_hammer_head_0_collision' && contact.distance <= .0001) hammerStrikeContact = true;
    const n1 = nameAt(model,model.name_bodyadr[b1]), n2 = nameAt(model,model.name_bodyadr[b2]);
    if (/^r[0-3]_/.test(n1) && /^r[0-3]_/.test(n2) && n1.slice(0,2) !== n2.slice(0,2) && contact.distance < -.001) robotCollisions.push(`${n1}/${n2}/${contact.distance.toFixed(4)}`);
    if ([b1,b2].includes(runtime.hammerBodyId) && contact.distance < -.0005) {
      const other=b1 === runtime.hammerBodyId ? n2 : n1;
      if (other === 'assembly_frame' || other === 'cross_member' || (/^r[0-3]_/.test(other) && !/^r[13]_(left|right)_finger$/.test(other))) hammerCollisions.push(`${other}/${contact.distance.toFixed(4)}`);
    }
    if ([b1,b2].includes(runtime.frameBodyId) && contact.distance <= .0001) {
      const match=/^r([0-2])_(left|right)_finger$/.exec(b1===runtime.frameBodyId?n2:n1);
      if(match)supportContacts[Number(match[1])][match[2]==='left'?0:1]=true;
    }
  }
  const hammerAperture = data.qpos[runtime.hammerFingerQposAddresses[0]]
    + data.qpos[runtime.hammerFingerQposAddresses[1]];
  const hammerLeftRecent = data.time - lastContactTimes.hammer.left
    <= ASSEMBLY1_STEP4_DURATIONS.contactGrace;
  const hammerRightRecent = data.time - lastContactTimes.hammer.right
    <= ASSEMBLY1_STEP4_DURATIONS.contactGrace;
  const hammerReceiverGraspPointDistance = distance(
    vector3(data.site_xpos, runtime.hammerReceiverGraspSiteId),
    vector3(data.site_xpos, runtime.hammerReceiverTcpSiteId),
  );
  const hammerGrasp = evaluateAssemblyStep4HammerHandover({
    leftContact: hammerLeftRecent,
    rightContact: hammerRightRecent,
    aperture: hammerAperture,
    receiverGraspPointDistance: hammerReceiverGraspPointDistance,
    leftContactDistance: hammerContacts.leftDistance,
    rightContactDistance: hammerContacts.rightDistance,
  });
  return {
    all,
    fastenerGrasp,
    fastenerCurrentGrasp,
    hammerGrasp,
    placement,
    frameTranslation,
    crossMemberTranslation,
    crossMemberRotationDegrees,
    fastenerPosition,
    fastenerPlanarDistance,
    fastenerHeight,
    fastenerAperture,
    fastenerLeftContact: fastenerContacts.left,
    fastenerRightContact: fastenerContacts.right,
    fastenerLeftContactDistance: fastenerContacts.leftDistance,
    fastenerRightContactDistance: fastenerContacts.rightDistance,
    hammerAperture,
    hammerLeftContact: hammerContacts.left,
    hammerRightContact: hammerContacts.right,
    hammerLeftContactDistance: hammerContacts.leftDistance,
    hammerRightContactDistance: hammerContacts.rightDistance,
    hammerReceiverGraspPointDistance,
    insertionDepth: insertion.depth,
    insertionTiltDegrees: insertion.tilt,
    workpiecePenetration,
    hammerStrikeContact,
    robotCollisions,
    hammerCollisions,
    supportContacts,
  };
}

function holdCurrentJointControls(data: MujocoData, arms: RuntimeArm[]) {
  for (const arm of arms) {
    for (let joint = 0; joint < arm.actuatorIndices.length; joint += 1) {
      data.ctrl[arm.actuatorIndices[joint]] = data.qpos[arm.qposAddresses[joint]];
    }
  }
}

export function AssemblyStep4Controller({
  requestId,
  resetGeneration,
  step3Complete,
  ownershipRef,
  diagnosticsRef,
  onStateChange,
}: AssemblyStep4ControllerProps) {
  const simulation = useMujoco();
  const { mujoco } = useMujocoWasm();
  const runtimeRef = useRef<RuntimePlan | null>(null);
  const machineRef = useRef<AssemblyStep4Machine | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastContactTimesRef = useRef({
    fastener: { left: Number.NEGATIVE_INFINITY, right: Number.NEGATIVE_INFINITY },
    hammer: { left: Number.NEGATIVE_INFINITY, right: Number.NEGATIVE_INFINITY },
  });
  const completedRequestRef = useRef(0);
  const strikeObservedRef = useRef(false);
  const strikeSupportContactsRef = useRef<boolean[][] | null>(null);
  const receiverPlanTimeRef = useRef(-Infinity);
  const stateCallbackRef = useRef(onStateChange);
  const reportedPhaseRef = useRef<AssemblyStep4State['phase']>('idle');
  stateCallbackRef.current = onStateChange;

  useEffect(() => () => {
    runtimeRef.current?.restoreGripperServo?.();
    runtimeRef.current?.gravityData?.delete();
    runtimeRef.current = null;
  }, []);

  useEffect(() => {
    runtimeRef.current?.restoreGripperServo?.();
    runtimeRef.current?.gravityData?.delete();
    runtimeRef.current = null;
    machineRef.current = null;
    lastTimeRef.current = null;
    lastContactTimesRef.current = {
      fastener: { left: Number.NEGATIVE_INFINITY, right: Number.NEGATIVE_INFINITY },
      hammer: { left: Number.NEGATIVE_INFINITY, right: Number.NEGATIVE_INFINITY },
    };
    diagnosticsRef.current = null;
    strikeObservedRef.current = false;
    strikeSupportContactsRef.current = null;
    receiverPlanTimeRef.current = -Infinity;
    completedRequestRef.current = requestId;
    reportedPhaseRef.current = 'idle';
    if (ownershipRef.current === 'step4') ownershipRef.current = 'manual';
  }, [diagnosticsRef, ownershipRef, resetGeneration]);

  useEffect(() => {
    if (requestId <= 0 || requestId <= completedRequestRef.current) return;
    if (simulation.status !== 'ready') return;
    const model = simulation.mjModelRef.current;
    const data = simulation.mjDataRef.current;
    if (!model || !data) return;
    completedRequestRef.current = requestId;
    stateCallbackRef.current({ phase: 'planning', failure: null });
    reportedPhaseRef.current = 'planning';
    if (!step3Complete || ownershipRef.current !== 'step3') {
      const failure = planningFailure('invalid-precondition', 'Step 3 is not complete');
      stateCallbackRef.current({ phase: 'error', failure });
      reportedPhaseRef.current = 'error';
      return;
    }
    const { plan, failure } = createRuntimePlan(model, data);
    if (!plan || failure) {
      const resolvedFailure = failure ?? planningFailure('invalid-precondition', 'unknown planning error');
      stateCallbackRef.current({ phase: 'error', failure: resolvedFailure });
      reportedPhaseRef.current = 'error';
      return;
    }
    const machine = createAssemblyStep4Machine();
    const originalNoslip=model.opt.noslip_iterations;
    model.opt.noslip_iterations=2;
    // The inherited demo gripper servo produces only ~1 N at this handle
    // width. Raise physical position-servo stiffness (not object forces or
    // attachments), keeping its existing actuator force limit. Restore the
    // manual-control calibration after completion/reset/error.
    const gripCalibrations = [1,3].map(index => {
      const offset=plan.arms[index].gripperActuatorIndex*10;
      const gain=model.actuator_gainprm[offset], stiffness=model.actuator_biasprm[offset+1], damping=model.actuator_biasprm[offset+2];
      model.actuator_gainprm[offset]=gain*8;
      model.actuator_biasprm[offset+1]=stiffness*8;
      model.actuator_biasprm[offset+2]=damping*Math.sqrt(8);
      return {offset,gain,stiffness,damping};
    });
    plan.restoreGripperServo = () => {
      if (simulation.mjModelRef.current !== model) return;
      model.opt.noslip_iterations=originalNoslip;
      for(const {offset,gain,stiffness,damping} of gripCalibrations) {
        model.actuator_gainprm[offset]=gain;
        model.actuator_biasprm[offset+1]=stiffness;
        model.actuator_biasprm[offset+2]=damping;
      }
      plan.restoreGripperServo = null;
    };
    if (mujoco) plan.gravityData = new mujoco.MjData(model);
    runtimeRef.current = plan;
    machineRef.current = machine;
    lastTimeRef.current = data.time;
    lastContactTimesRef.current = {
      fastener: { left: Number.NEGATIVE_INFINITY, right: Number.NEGATIVE_INFINITY },
      hammer: { left: Number.NEGATIVE_INFINITY, right: Number.NEGATIVE_INFINITY },
    };
    ownershipRef.current = 'step4';
    stateCallbackRef.current({ phase: machine.phase, failure: null });
    reportedPhaseRef.current = machine.phase;
  }, [ownershipRef, requestId, simulation, step3Complete]);

  useBeforePhysicsStep((model, data) => {
    if (ownershipRef.current !== 'step4') return;
    const runtime = runtimeRef.current;
    const machine = machineRef.current;
    if (!runtime || !machine) return;
    const previousTime = lastTimeRef.current ?? data.time;
    const deltaSeconds = Math.max(0, data.time - previousTime);
    lastTimeRef.current = data.time;
    const sample = sampleRuntime(model, data, runtime, lastContactTimesRef.current);
    let alignmentFailure: AssemblyStep4Failure | null = null;
    if (mujoco && machine.phase === 'dual-clamp' && machine.phaseElapsed < 2 && data.time - receiverPlanTimeRef.current > .25) {
      try {
        planMeasuredAssemblyPhase(mujoco,model,data,machine.phase,runtime.armPlans);
        receiverPlanTimeRef.current = data.time;
      } catch (error) {
        alignmentFailure = {code:'receiver-alignment-failed',detail:String(error)};
      }
    }
    if (sample.hammerStrikeContact && machine.phase === 'hammer-strike') {
      strikeObservedRef.current = true;
      strikeSupportContactsRef.current = sample.supportContacts.map(pair=>[...pair]);
    }
    let nextMachine = advanceAssemblyStep4Machine(machine, deltaSeconds, {
      all: ['donor-tighten', 'prepare', 'engage'].includes(machine.phase)
        ? { ok: true }
        : sample.all,
      fastenerGrasp: sample.fastenerGrasp,
      fastenerCurrentGrasp: sample.fastenerCurrentGrasp,
      hammerGrasp: sample.hammerGrasp,
      placement: sample.placement,
    });
    if (mujoco && machine.phase === 'receiver-align' && machine.phaseElapsed >= ASSEMBLY1_STEP4_DURATIONS.receiverAlign) {
      // Do not close merely because the nominal approach duration elapsed.
      // Follow the real handle with OPEN fingers until centered and settled.
      const valid = sample.hammerReceiverGraspPointDistance < .010;
      const settled = valid ? machine.continuousValidSeconds + deltaSeconds : 0;
      if (settled < .3) {
        nextMachine = {...machine, phaseElapsed:machine.phaseElapsed+deltaSeconds,continuousValidSeconds:settled};
        if (data.time-receiverPlanTimeRef.current>.25) {
          try {
            planMeasuredAssemblyPhase(mujoco,model,data,'dual-clamp',runtime.armPlans);
            delete runtime.armPlans[3].phasePaths?.['receiver-align'];
            receiverPlanTimeRef.current=data.time;
          } catch(error) {alignmentFailure={code:'receiver-alignment-failed',detail:String(error)};}
        }
        if (machine.phaseElapsed > 12) alignmentFailure={code:'receiver-center-timeout',detail:String(sample.hammerReceiverGraspPointDistance)};
      }
    } else if (machine.phase === 'receiver-align' && nextMachine.phase === 'dual-clamp') {
      nextMachine={...machine,phaseElapsed:machine.phaseElapsed+deltaSeconds};
    }
    if (machine.phase === 'insert' && sample.insertionDepth >= .003 && sample.fastenerPlanarDistance < .004 && nextMachine.phase !== 'error') {
      runtime.armPlans[2].insert = runtime.arms[2].qposAddresses.map(a => data.qpos[a]);
      nextMachine = { phase: 'fastener-release', phaseElapsed: 0, continuousValidSeconds: 0, failure: null };
    }
    if (machine.phase === 'hammer-strike' && sample.hammerStrikeContact && nextMachine.phase !== 'error') {
      // A tap ends on real face/head contact, not by pressing to a fixed depth.
      runtime.armPlans[3].strike=runtime.arms[3].qposAddresses.map(a=>data.qpos[a]);
      nextMachine={phase:'hammer-recover',phaseElapsed:0,continuousValidSeconds:0,failure:null};
    }
    const safetyFailure = alignmentFailure ?? (sample.robotCollisions.length ? {code:'robot-collision',detail:sample.robotCollisions.join(',')}
      : sample.hammerCollisions.length ? {code:'hammer-collision',detail:sample.hammerCollisions.join(',')}
      : ['engage-settle','receiver-align','dual-clamp','handover-verification'].includes(machine.phase) && data.xpos[runtime.hammerBodyId*3+2] < .30 ? {code:'hammer-below-exchange-clearance'}
      : sample.workpiecePenetration > .0015 ? {code:'fastener-penetration',detail:String(sample.workpiecePenetration)}
      : machine.phase === 'support-clamp' && nextMachine.phase === 'hammer-stage' && sample.supportContacts.some(p=>!p.every(Boolean)) ? {code:'support-not-engaged',detail:JSON.stringify(sample.supportContacts)}
      : machine.phase === 'hammer-strike' && nextMachine.phase === 'hammer-recover' && !strikeObservedRef.current ? {code:'missing-strike-contact'} : null);
    if (safetyFailure) nextMachine = {phase:'error',phaseElapsed:0,continuousValidSeconds:0,failure:safetyFailure};
    if (nextMachine.phase !== machine.phase && nextMachine.phase !== 'error') {
      try {
        if (!mujoco) throw new Error('MuJoCo unavailable');
        planMeasuredAssemblyPhase(mujoco,model,data,nextMachine.phase,runtime.armPlans);
      } catch(error) {
        nextMachine = {phase:'error',phaseElapsed:0,continuousValidSeconds:0,failure:{code:'measured-planning-failed',detail:String(error)}};
      }
    }
    if (machine.phase === 'prepare' && nextMachine.phase === 'engage') {
      runtime.frameBaseline = vector3(data.xpos, runtime.frameBodyId);
      runtime.crossMemberBaseline = vector3(data.xpos, runtime.crossMemberBodyId);
      runtime.crossMemberBaselineQuaternion = quaternion4(data.xquat, runtime.crossMemberBodyId);
    }
    if (machine.phase === 'engage-settle' && nextMachine.phase === 'dual-clamp') {
      runtime.frameBaseline = vector3(data.xpos, runtime.frameBodyId);
      runtime.crossMemberBaseline = vector3(data.xpos, runtime.crossMemberBodyId);
      runtime.crossMemberBaselineQuaternion = quaternion4(data.xquat, runtime.crossMemberBodyId);
    }
    machineRef.current = nextMachine;
    if (nextMachine.phase !== reportedPhaseRef.current) {
      reportedPhaseRef.current = nextMachine.phase;
      stateCallbackRef.current({ phase: nextMachine.phase, failure: nextMachine.failure });
    }
    if (nextMachine.phase === 'error') {
      runtime.restoreGripperServo?.();
      holdCurrentJointControls(data, runtime.arms);
      ownershipRef.current = 'manual';
    } else {
      if (nextMachine.phase === 'complete') runtime.restoreGripperServo?.();
      const controlFrame = createAssemblyStep4ControlFrame(nextMachine, runtime.armPlans);
      // Gravity-only feedforward through the existing, force-limited joint
      // actuators. Zero scratch velocity excludes delayed Coriolis feedback.
      const gravity = runtime.gravityData;
      if (gravity && mujoco) {
        gravity.qpos.set(data.qpos);
        gravity.qvel.fill(0);
        mujoco.mj_forward(model, gravity);
      }
      for (let index = 0; index < runtime.arms.length; index += 1) {
        const arm = runtime.arms[index];
        const controls = controlFrame.arms[index];
        for (let joint = 0; joint < arm.actuatorIndices.length; joint += 1) {
          const actuator = arm.actuatorIndices[joint];
          const jointId = model.actuator_trnid[actuator * 2];
          const gain = model.actuator_gainprm[actuator * 10];
          const offset = index > 0 && gravity && jointId >= 0 && gain > 0
            ? gravity.qfrc_bias[model.jnt_dofadr[jointId]] / gain : 0;
          data.ctrl[actuator] = Math.max(model.actuator_ctrlrange[actuator*2],Math.min(model.actuator_ctrlrange[actuator*2+1],controls.jointTargets[joint] + offset));
        }
        data.ctrl[arm.gripperActuatorIndex] = controls.gripperTarget;
      }
    }
    diagnosticsRef.current = {
      phase: nextMachine.phase,
      phaseElapsed: nextMachine.phaseElapsed,
      continuousValidSeconds: nextMachine.continuousValidSeconds,
      failure: nextMachine.failure,
      simulationTime: data.time,
      frameTranslation: sample.frameTranslation,
      crossMemberTranslation: sample.crossMemberTranslation,
      crossMemberRotationDegrees: sample.crossMemberRotationDegrees,
      fastenerPosition: sample.fastenerPosition,
      fastenerPlanarDistance: sample.fastenerPlanarDistance,
      fastenerHeight: sample.fastenerHeight,
      fastenerAperture: sample.fastenerAperture,
      fastenerLeftContact: sample.fastenerLeftContact,
      fastenerRightContact: sample.fastenerRightContact,
      fastenerLeftContactDistance: sample.fastenerLeftContactDistance,
      fastenerRightContactDistance: sample.fastenerRightContactDistance,
      hammerAperture: sample.hammerAperture,
      hammerLeftContact: sample.hammerLeftContact,
      hammerRightContact: sample.hammerRightContact,
      hammerLeftContactDistance: sample.hammerLeftContactDistance,
      hammerRightContactDistance: sample.hammerRightContactDistance,
      hammerReceiverGraspPointDistance: sample.hammerReceiverGraspPointDistance,
      insertionDepth: sample.insertionDepth,
      insertionTiltDegrees: sample.insertionTiltDegrees,
      workpiecePenetration: sample.workpiecePenetration,
      hammerStrikeContact: sample.hammerStrikeContact,
      strikeObserved: strikeObservedRef.current,
      strikeSupportContacts: strikeSupportContactsRef.current,
      robotCollisions: sample.robotCollisions,
      hammerCollisions: sample.hammerCollisions,
      supportContacts: sample.supportContacts,
    };
    if (nextMachine.phase === 'error') {
      runtime.gravityData?.delete();
      runtime.gravityData = null;
      runtimeRef.current = null;
      machineRef.current = null;
    }
  });

  return null;
}
