import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import {
  findBodyByName,
  findJointByName,
  findSiteByName,
  useBeforePhysicsStep,
  useMujoco,
} from 'mujoco-react';
import type { MujocoData, MujocoModel } from 'mujoco-react';

import {
  consumeMujocoContacts,
  isPassiveRetainingContactGeom,
} from './mujocoContact.js';
import { ASSEMBLY1_STEP2_ARMS, quaternionAngularDistanceDegrees } from './assemblyStep2.js';
import {
  ASSEMBLY1_STEP3_START_GRIPPER_CLAMPS,
  ASSEMBLY1_STEP3_HAMMER_ARM,
  ASSEMBLY1_STEP3_HOME_JOINT_TARGETS,
  ASSEMBLY1_STEP3_LIMITS,
  ASSEMBLY1_STEP3_TRANSPORT_ARMS,
  advanceAssemblyStep3Machine,
  createAssemblyStep3ControlFrame,
  createAssemblyStep3Machine,
  evaluateAssemblyStep3Alignment,
  evaluateAssemblyStep3Transport,
  holdAssemblyStep3Controls,
  selectAssemblyStep3HoldTarget,
} from './assemblyStep3.js';
import type {
  AssemblyStep3ArmPlan,
  AssemblyStep3Failure,
  AssemblyStep3Machine,
  AssemblyStep3RuntimeDiagnostics,
  AssemblyStep3State,
  AssemblyStep3Verdict,
} from './assemblyStep3.js';

const HOLE_SITE_NAMES = [
  'cross_member_hole_nw',
  'cross_member_hole_ne',
  'cross_member_hole_sw',
  'cross_member_hole_se',
];
const RECEIVER_SITE_NAMES = [
  'frame_receiver_nw',
  'frame_receiver_ne',
  'frame_receiver_sw',
  'frame_receiver_se',
];
const FORBIDDEN_BODY_NAMES = [
  'frame_supports',
  'parts_tray',
  'mounting_plate',
  'fastener_tray',
  'fastener_1',
  'fastener_2',
  'fastener_3',
  'fastener_4',
  'manual_screwdriver',
  'double_face_hammer',
  'torque_driver',
  'tool_mat',
  'hammer_pickup_cradle_tail',
  'hammer_pickup_cradle_head',
];

interface RuntimeArm {
  armKey: string;
  targetBody: string;
  targetBodyId: number;
  actuatorIndices: number[];
  gripperActuatorIndex: number;
  qposAddresses: number[];
  fingerQposAddresses: [number, number];
  leftFingerBodyId: number;
  rightFingerBodyId: number;
}

interface RuntimePlan {
  arms: RuntimeArm[];
  armPlans: AssemblyStep3ArmPlan[];
  forbiddenBodyIds: Set<number>;
  frameBodyId: number;
  crossMemberBodyId: number;
  frameBaseline: [number, number, number];
  holeSiteIds: number[];
  receiverSiteIds: number[];
}

interface AssemblyStep3ControllerProps {
  requestId: number;
  resetGeneration: number;
  step2Complete: boolean;
  ownershipRef: MutableRefObject<'manual' | 'step1' | 'step2' | 'step3' | 'step4'>;
  diagnosticsRef: MutableRefObject<AssemblyStep3RuntimeDiagnostics | null>;
  onStateChange: (state: AssemblyStep3State) => void;
}

function distance(first: readonly number[], second: readonly number[]) {
  return Math.hypot(...first.map((value, index) => value - second[index]));
}

function vector3(values: Float64Array, index: number): [number, number, number] {
  const offset = index * 3;
  return [values[offset], values[offset + 1], values[offset + 2]];
}

function quaternion4(values: Float64Array, index: number): [number, number, number, number] {
  const offset = index * 4;
  return [values[offset], values[offset + 1], values[offset + 2], values[offset + 3]];
}

function nameAt(model: MujocoModel, address: number) {
  let name = '';
  for (let index = address; model.names[index] !== 0; index += 1) {
    name += String.fromCharCode(model.names[index]);
  }
  return name;
}

function bodyName(model: MujocoModel, bodyId: number) {
  if (bodyId < 0 || bodyId >= model.nbody) return `body-${bodyId}`;
  return nameAt(model, model.name_bodyadr[bodyId]);
}

function planningFailure(
  code: AssemblyStep3Failure['code'],
  detail: string,
): AssemblyStep3Failure {
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
): { plan: RuntimePlan | null; failure: AssemblyStep3Failure | null } {
  const frameBodyId = findBodyByName(model, 'assembly_frame');
  const crossMemberBodyId = findBodyByName(model, 'cross_member');
  const holeSiteIds = HOLE_SITE_NAMES.map((name) => findSiteByName(model, name));
  const receiverSiteIds = RECEIVER_SITE_NAMES.map((name) => findSiteByName(model, name));
  if (
    frameBodyId < 0
    || crossMemberBodyId < 0
    || holeSiteIds.some((id) => id < 0)
    || receiverSiteIds.some((id) => id < 0)
  ) {
    return { plan: null, failure: planningFailure('missing-resource', 'assembly interface') };
  }

  const arms: RuntimeArm[] = [];
  const armPlans: AssemblyStep3ArmPlan[] = [];
  for (const [index, arm] of ASSEMBLY1_STEP2_ARMS.entries()) {
    const jointIds = arm.jointNames.map((name) => findJointByName(model, name));
    const fingerJointIds = arm.fingerJointNames.map((name) => findJointByName(model, name));
    const leftFingerBodyId = findBodyByName(model, arm.leftFingerBody);
    const rightFingerBodyId = findBodyByName(model, arm.rightFingerBody);
    const targetBodyId = findBodyByName(model, arm.targetBody);
    if (
      jointIds.some((id) => id < 0)
      || fingerJointIds.some((id) => id < 0)
      || leftFingerBodyId < 0
      || rightFingerBodyId < 0
      || targetBodyId < 0
      || arm.actuatorIndices.some((actuator) => actuator < 0 || actuator >= model.nu)
      || arm.gripperActuatorIndex < 0
      || arm.gripperActuatorIndex >= model.nu
    ) {
      return { plan: null, failure: planningFailure('missing-resource', arm.key) };
    }
    if (Math.abs(data.ctrl[arm.gripperActuatorIndex] - ASSEMBLY1_STEP3_START_GRIPPER_CLAMPS[index]) > 1e-6) {
      return { plan: null, failure: planningFailure('invalid-precondition', `${arm.key} gripper`) };
    }
    const qposAddresses = jointIds.map((jointId) => model.jnt_qposadr[jointId]);
    const hold = selectAssemblyStep3HoldTarget(
      index,
      qposAddresses.map((address) => data.qpos[address]),
    );
    const transport = ASSEMBLY1_STEP3_TRANSPORT_ARMS.find(({ armIndex }) => armIndex === index);
    const hammer = ASSEMBLY1_STEP3_HAMMER_ARM.armIndex === index
      ? ASSEMBLY1_STEP3_HAMMER_ARM
      : null;
    const generatedTargets = transport
      ? [
        transport.liftJointTargets,
        transport.transferAJointTargets,
        transport.transferMidJointTargets,
        transport.hoverJointTargets,
        transport.descentMidJointTargets,
        transport.alignedJointTargets,
        ...transport.transportLiftPathJointTargets,
        ...transport.transportAPathJointTargets,
        ...transport.transportBPathJointTargets,
        ...transport.transportDescentPathJointTargets,
      ]
      : hammer
        ? [
          hammer.liftJointTargets,
          hammer.handoverJointTargets,
          ...hammer.liftPathJointTargets,
        ]
        : [];
    if (
      !solutionIsWithinLimits(model, jointIds, hold)
      || generatedTargets.some((target) => !solutionIsWithinLimits(model, jointIds, target))
    ) {
      return { plan: null, failure: planningFailure('joint-limit', arm.key) };
    }
    arms.push({
      armKey: arm.key,
      targetBody: arm.targetBody,
      targetBodyId,
      actuatorIndices: [...arm.actuatorIndices],
      gripperActuatorIndex: arm.gripperActuatorIndex,
      qposAddresses,
      fingerQposAddresses: [
        model.jnt_qposadr[fingerJointIds[0]],
        model.jnt_qposadr[fingerJointIds[1]],
      ],
      leftFingerBodyId,
      rightFingerBodyId,
    });
    let hammerPrelift = hammer?.preliftJointTargets ?? hold;
    let hammerLift = hammer?.liftJointTargets ?? hold;
    let hammerHandover = hammer?.handoverJointTargets ?? hold;
    if (transport) {
      const lift = transport.liftJointTargets;
      const transferA = transport.transferAJointTargets;
      const transferMid = transport.transferMidJointTargets;
      const hover = transport.hoverJointTargets;
      const descentMid = transport.descentMidJointTargets;
      const aligned = transport.alignedJointTargets;
      armPlans.push({
        armKey: arm.key,
        hold,
        lift,
        transferA,
        transferMid,
        hover,
        descentMid,
        aligned,
        home: ASSEMBLY1_STEP3_HOME_JOINT_TARGETS,
        hammerPrelift,
        hammerLift,
        hammerHandover,
        transportLiftPath: [hold, ...transport.transportLiftPathJointTargets],
        transportAPath: [lift, ...transport.transportAPathJointTargets],
        transportBPath: [transferA, ...transport.transportBPathJointTargets],
        transportDescentPath: [hover, ...transport.transportDescentPathJointTargets],
      });
      continue;
    }
    if (hammer) {
      hammerPrelift = hammer.preliftJointTargets;
      hammerLift = hammer.liftJointTargets;
      hammerHandover = hammer.handoverJointTargets;
      armPlans.push({
        armKey: arm.key,
        hold,
        lift: hold,
        transferA: hold,
        transferMid: hold,
        hover: hold,
        descentMid: hold,
        aligned: hold,
        home: hold,
        hammerPrelift,
        hammerLift,
        hammerHandover,
        hammerLiftPath: [hold, ...hammer.liftPathJointTargets],
        hammerHandoverPath: [hammerLift, hammerHandover],
      });
      continue;
    }
    armPlans.push({
      armKey: arm.key,
      hold,
      lift: hold,
      transferA: hold,
      transferMid: hold,
      hover: hold,
      descentMid: hold,
      aligned: hold,
      home: index >= 2 ? ASSEMBLY1_STEP3_HOME_JOINT_TARGETS : hold,
      hammerPrelift,
      hammerLift,
      hammerHandover,
    });
  }

  return {
    plan: {
      arms,
      armPlans,
      forbiddenBodyIds: new Set(
        FORBIDDEN_BODY_NAMES
          .map((name) => findBodyByName(model, name))
          .filter((id) => id >= 0),
      ),
      frameBodyId,
      crossMemberBodyId,
      frameBaseline: vector3(data.xpos, frameBodyId),
      holeSiteIds,
      receiverSiteIds,
    },
    failure: null,
  };
}

function contactsByFinger(model: MujocoModel, data: MujocoData, arms: RuntimeArm[]) {
  const result = new Map<number, Map<number, number | null>>();
  for (const arm of arms) {
    result.set(arm.leftFingerBodyId, new Map());
    result.set(arm.rightFingerBodyId, new Map());
  }
  const record = (
    fingerBody: number,
    oppositeBody: number,
    oppositeGeomId: number,
    contactDistance: number,
  ) => {
    const contacts = result.get(fingerBody);
    if (!contacts) return;
    if (isPassiveRetainingContactGeom(nameAt(model, model.name_geomadr[oppositeGeomId]))) {
      if (!contacts.has(oppositeBody)) contacts.set(oppositeBody, null);
      return;
    }
    const previous = contacts.get(oppositeBody);
    if (previous === undefined || previous === null || contactDistance < previous) {
      contacts.set(oppositeBody, contactDistance);
    }
  };
  for (const contact of consumeMujocoContacts(data.contact, data.ncon)) {
    const firstBody = model.geom_bodyid[contact.geom1];
    const secondBody = model.geom_bodyid[contact.geom2];
    record(firstBody, secondBody, contact.geom2, contact.distance);
    record(secondBody, firstBody, contact.geom1, contact.distance);
  }
  return result;
}

function sampleRuntime(
  model: MujocoModel,
  data: MujocoData,
  runtime: RuntimePlan,
  requireBilateralContact: boolean,
) {
  const contacts = contactsByFinger(model, data, runtime.arms);
  const arms = runtime.arms.map((arm) => {
    const leftContacts = contacts.get(arm.leftFingerBodyId) ?? new Map<number, number | null>();
    const rightContacts = contacts.get(arm.rightFingerBodyId) ?? new Map<number, number | null>();
    const leftIds = [...leftContacts.keys()];
    const rightIds = [...rightContacts.keys()];
    const forbiddenBodies = [...new Set([...leftIds, ...rightIds])]
      .filter((bodyId) => runtime.forbiddenBodyIds.has(bodyId) && bodyId !== arm.targetBodyId)
      .map((bodyId) => bodyName(model, bodyId));
    const aperture = data.qpos[arm.fingerQposAddresses[0]]
      + data.qpos[arm.fingerQposAddresses[1]];
    const verdict = evaluateAssemblyStep3Transport({
      targetBody: arm.targetBody,
      leftContactBodies: leftIds.map((bodyId) => bodyName(model, bodyId)),
      rightContactBodies: rightIds.map((bodyId) => bodyName(model, bodyId)),
      forbiddenBodies,
      aperture,
      leftTargetContactDistance: leftContacts.get(arm.targetBodyId) ?? null,
      rightTargetContactDistance: rightContacts.get(arm.targetBodyId) ?? null,
      requireBilateralContact: requireBilateralContact || arm.targetBody === 'double_face_hammer',
      minimumAperture: arm.targetBody === 'double_face_hammer'
        ? ASSEMBLY1_STEP3_LIMITS.hammerMinimumAperture
        : arm.targetBody === 'cross_member'
          ? ASSEMBLY1_STEP3_LIMITS.crossMemberMinimumAperture
          : ASSEMBLY1_STEP3_LIMITS.minimumAperture,
      maximumContactPenetration: arm.targetBody === 'assembly_frame'
        ? ASSEMBLY1_STEP3_LIMITS.frameMaximumContactPenetration
        : arm.targetBody === 'double_face_hammer'
          ? ASSEMBLY1_STEP3_LIMITS.hammerMaximumContactPenetration
          : ASSEMBLY1_STEP3_LIMITS.maximumContactPenetration,
    });
    return {
      armKey: arm.armKey,
      targetBody: arm.targetBody,
      leftContactBodies: leftIds.map((bodyId) => bodyName(model, bodyId)),
      rightContactBodies: rightIds.map((bodyId) => bodyName(model, bodyId)),
      aperture,
      leftTargetContactDistance: leftContacts.get(arm.targetBodyId) ?? null,
      rightTargetContactDistance: rightContacts.get(arm.targetBodyId) ?? null,
      gripperControl: data.ctrl[arm.gripperActuatorIndex],
      verdict: verdict.ok ? verdict : { ...verdict, armKey: arm.armKey },
    };
  });
  const frameTranslation = distance(
    vector3(data.xpos, runtime.frameBodyId),
    runtime.frameBaseline,
  );
  const crossMemberPosition = vector3(data.xpos, runtime.crossMemberBodyId);
  const crossMemberQuaternion = quaternion4(data.xquat, runtime.crossMemberBodyId);
  const crossMemberRotationDegrees = quaternionAngularDistanceDegrees(
    crossMemberQuaternion,
    [1, 0, 0, 0],
  );
  const holeOffsets = runtime.holeSiteIds.map((siteId, index) => {
    const hole = vector3(data.site_xpos, siteId);
    const receiver = vector3(data.site_xpos, runtime.receiverSiteIds[index]);
    return [
      hole[0] - receiver[0],
      hole[1] - receiver[1],
      hole[2] - receiver[2],
    ] as [number, number, number];
  });
  const holeDistances = holeOffsets.map((offset) => Math.hypot(...offset));
  const holePlanarDistances = holeOffsets.map((offset) => Math.hypot(offset[0], offset[1]));
  const holeVerticalOffsets = holeOffsets.map((offset) => Math.abs(offset[2]));
  const alignment = evaluateAssemblyStep3Alignment({
    holePlanarDistances,
    holeVerticalOffsets,
    frameTranslation,
    crossMemberRotationDegrees,
  });
  const placedAlignment = evaluateAssemblyStep3Alignment({
    holePlanarDistances,
    holeVerticalOffsets,
    frameTranslation,
    crossMemberRotationDegrees,
    verticalTolerance: ASSEMBLY1_STEP3_LIMITS.seatedVerticalOffset,
  });
  const all = arms.find(({ verdict }) => !verdict.ok)?.verdict ?? { ok: true as const };
  return {
    arms,
    crossMemberPosition,
    crossMemberQuaternion,
    frameTranslation,
    crossMemberRotationDegrees,
    holeDistances,
    holePlanarDistances,
    holeVerticalOffsets,
    all: all as AssemblyStep3Verdict,
    alignment,
    placedAlignment,
  };
}

export function AssemblyStep3Controller({
  requestId,
  resetGeneration,
  step2Complete,
  ownershipRef,
  diagnosticsRef,
  onStateChange,
}: AssemblyStep3ControllerProps) {
  const simulation = useMujoco();
  const runtimeRef = useRef<RuntimePlan | null>(null);
  const machineRef = useRef<AssemblyStep3Machine | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const completedRequestRef = useRef(0);
  const stateCallbackRef = useRef(onStateChange);
  const reportedPhaseRef = useRef<AssemblyStep3State['phase']>('idle');
  stateCallbackRef.current = onStateChange;

  useEffect(() => {
    runtimeRef.current = null;
    machineRef.current = null;
    lastTimeRef.current = null;
    diagnosticsRef.current = null;
    completedRequestRef.current = requestId;
    reportedPhaseRef.current = 'idle';
    if (ownershipRef.current === 'step3') ownershipRef.current = 'manual';
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
    if (!step2Complete || ownershipRef.current !== 'step2') {
      const failure = planningFailure('invalid-precondition', 'Step 2 is not complete');
      stateCallbackRef.current({ phase: 'error', failure });
      reportedPhaseRef.current = 'error';
      return;
    }
    const { plan, failure } = createRuntimePlan(model, data);
    if (!plan || failure) {
      const resolvedFailure = failure
        ?? planningFailure('invalid-precondition', 'unknown planning error');
      stateCallbackRef.current({ phase: 'error', failure: resolvedFailure });
      reportedPhaseRef.current = 'error';
      return;
    }
    const machine = createAssemblyStep3Machine();
    runtimeRef.current = plan;
    machineRef.current = machine;
    lastTimeRef.current = data.time;
    ownershipRef.current = 'step3';
    stateCallbackRef.current({ phase: machine.phase, failure: null });
    reportedPhaseRef.current = machine.phase;
  }, [ownershipRef, requestId, simulation, step2Complete]);

  useBeforePhysicsStep((model, data) => {
    if (ownershipRef.current !== 'step3') return;
    const runtime = runtimeRef.current;
    const machine = machineRef.current;
    if (!runtime || !machine) return;
    const previousTime = lastTimeRef.current ?? data.time;
    const deltaSeconds = Math.max(0, data.time - previousTime);
    lastTimeRef.current = data.time;
    // Step 2 has already established bilateral contact for every grasp. Step 3
    // validates retained closure and collision evidence without treating normal
    // single-frame contact-manifold flicker as a dropped part.
    const sample = sampleRuntime(model, data, runtime, false);
    const nextMachine = advanceAssemblyStep3Machine(machine, deltaSeconds, {
      all: sample.all,
      alignment: machine.phase === 'placed-verification'
        ? sample.placedAlignment
        : sample.alignment,
    });
    machineRef.current = nextMachine;
    if (nextMachine.phase !== reportedPhaseRef.current) {
      reportedPhaseRef.current = nextMachine.phase;
      stateCallbackRef.current({
        phase: nextMachine.phase,
        failure: nextMachine.failure,
      });
    }
    if (nextMachine.phase === 'error') {
      holdAssemblyStep3Controls(data.ctrl, data.qpos, runtime.arms);
      ownershipRef.current = 'manual';
    } else {
      const controlFrame = createAssemblyStep3ControlFrame(nextMachine, runtime.armPlans);
      for (let index = 0; index < runtime.arms.length; index += 1) {
        const arm = runtime.arms[index];
        const controls = controlFrame.arms[index];
        for (let joint = 0; joint < arm.actuatorIndices.length; joint += 1) {
          data.ctrl[arm.actuatorIndices[joint]] = controls.jointTargets[joint];
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
      crossMemberPosition: sample.crossMemberPosition,
      crossMemberQuaternion: sample.crossMemberQuaternion,
      frameTranslation: sample.frameTranslation,
      crossMemberRotationDegrees: sample.crossMemberRotationDegrees,
      holeDistances: sample.holeDistances,
      holePlanarDistances: sample.holePlanarDistances,
      holeVerticalOffsets: sample.holeVerticalOffsets,
      arms: sample.arms,
    };
    if (nextMachine.phase === 'error') {
      runtimeRef.current = null;
      machineRef.current = null;
    }
  });

  return null;
}
