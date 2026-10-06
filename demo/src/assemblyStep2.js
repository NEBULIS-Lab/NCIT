import {
  interpolateJointTargets,
  topDownTcpQuaternion,
} from './assemblyStep1.js';

export const ASSEMBLY1_STEP2_DURATIONS = Object.freeze({
  approach: 1.4,
  slowDescent: 0.8,
  contactSettle: 1.5,
  frameClamp: 0.8,
  crossMemberClamp: 1,
  hammerClamp: 0.8,
  contactWindow: 0.08,
  contactGrace: 0.5,
  verificationTimeout: 4,
  stableHold: 2,
});

export const ASSEMBLY1_STEP2_GRIPPER_CLAMPS = Object.freeze([130, 130, 135, 130]);

export const ASSEMBLY1_STEP2_LIMITS = Object.freeze({
  tcpPosition: 0.06,
  tcpOrientationDegrees: 8,
  preStepObjectDrift: 0.003,
  objectTranslation: 0.005,
  settlingTranslation: Object.freeze({
    assembly_frame: 0.008,
    double_face_hammer: 0.05,
    cross_member: 0.03,
  }),
  objectRotationDegrees: 8,
  hammerRotationDegrees: 10,
  verticalDisplacement: 0.003,
  hammerVerticalDisplacement: 0.005,
  crossMemberVerticalDisplacement: 0.015,
  minimumAperture: 0.035,
  hammerMinimumAperture: 0.018,
  crossMemberMinimumAperture: 0.035,
  maximumContactPenetration: 0.002,
  hammerMaximumContactPenetration: 0.0025,
  contactComparisonEpsilon: 0.00015,
});

const roles = [
  {
    role: 'south frame rail',
    targetBody: 'assembly_frame',
    contactWaypoint: [0.18, -0.23, 0.25],
    // Match Step 1's equivalent parallel-gripper orientation so Arm 1 stays
    // on the same joint-space branch instead of winding around to +90°.
    closingAxisYawDegrees: -90,
    approachJointTargets: [1.942389, 0.815094, -0.809002, -1.570123, 0.654009, 2.095807, 1.73732],
    contactJointTargets: [1.934841, 0.835522, -0.795011, -1.573686, 0.668658, 2.118614, 1.729869],
  },
  {
    role: 'horizontal hammer handle',
    targetBody: 'double_face_hammer',
    contactWaypoint: [0.675, -0.421, 0.197],
    closingAxisYawDegrees: 90,
    approachJointTargets: [1.638121, 0.366542, 0.945253, -2.447632, -0.585481, 2.590601, 2.27899],
    contactJointTargets: [1.687564, 0.406326, 0.884225, -2.438215, -0.645467, 2.611236, 2.320387],
  },
  {
    role: 'cross member north balance point',
    targetBody: 'cross_member',
    contactWaypoint: [-0.489, 0.56, 0.21],
    closingAxisYawDegrees: 0,
    approachJointTargets: [1.496261, -0.161873, -0.561838, -2.893824, -0.226057, 2.747528, -2.777375],
    contactJointTargets: [1.528987, -0.095909, -0.578999, -2.894551, -0.162476, 2.810213, -2.821088],
  },
  {
    role: 'cross member south balance point',
    targetBody: 'cross_member',
    contactWaypoint: [-0.482, 0.32, 0.213],
    closingAxisYawDegrees: 0,
    approachJointTargets: [2.733839, 0.108799, -0.361694, -2.564881, 0.079698, 2.665436, -0.052485],
    contactJointTargets: [2.727123, 0.153363, -0.348007, -2.563107, 0.119418, 2.704486, -0.081228],
  },
];

export const ASSEMBLY1_STEP2_ARMS = roles.map((role, index) => {
  const prefix = `r${index}_`;
  const actuatorOffset = index * 8;
  return Object.freeze({
    key: `r${index}`,
    label: `Arm ${index + 1}`,
    ...role,
    contactWaypoint: Object.freeze([...role.contactWaypoint]),
    approachWaypoint: Object.freeze([
      role.contactWaypoint[0],
      role.contactWaypoint[1],
      Number((role.contactWaypoint[2] + 0.015).toFixed(6)),
    ]),
    tcpQuaternion: Object.freeze(topDownTcpQuaternion(role.closingAxisYawDegrees)),
    approachJointTargets: Object.freeze([...role.approachJointTargets]),
    contactJointTargets: Object.freeze([...role.contactJointTargets]),
    siteName: `${prefix}tcp`,
    jointNames: Object.freeze(
      Array.from({ length: 7 }, (_, joint) => `${prefix}joint${joint + 1}`),
    ),
    fingerJointNames: Object.freeze([
      `${prefix}finger_joint1`,
      `${prefix}finger_joint2`,
    ]),
    leftFingerBody: `${prefix}left_finger`,
    rightFingerBody: `${prefix}right_finger`,
    actuatorIndices: Object.freeze(
      Array.from({ length: 7 }, (_, joint) => actuatorOffset + joint),
    ),
    gripperActuatorIndex: actuatorOffset + 7,
  });
});

export function interpolateAssemblyStep2Gripper(from, to, progress) {
  return interpolateJointTargets([from], [to], progress)[0];
}

export function releaseAssemblyStep2Controls(controls, positions, arms) {
  for (const arm of arms) {
    for (let joint = 0; joint < arm.actuatorIndices.length; joint += 1) {
      controls[arm.actuatorIndices[joint]] = positions[arm.qposAddresses[joint]];
    }
    controls[arm.gripperActuatorIndex] = 255;
  }
}

export function captureAssemblyStep2JointTargets(positions, arms) {
  return arms.map((arm) => arm.qposAddresses.map((address) => positions[address]));
}

export function createAssemblyStep2ControlFrame(machine, plans) {
  const progressFor = (duration) => machine.phaseElapsed / duration;
  const clamps = ASSEMBLY1_STEP2_GRIPPER_CLAMPS;
  const gripperTargets = [255, 255, 255, 255];
  if (machine.phase === 'frame-clamp') {
    gripperTargets[0] = interpolateAssemblyStep2Gripper(
      255,
      clamps[0],
      progressFor(ASSEMBLY1_STEP2_DURATIONS.frameClamp),
    );
  } else if (machine.phase === 'frame-verification') {
    gripperTargets[0] = clamps[0];
  } else if (machine.phase === 'cross-member-clamp') {
    gripperTargets[0] = clamps[0];
    const sharedTarget = interpolateAssemblyStep2Gripper(
      255,
      clamps[2],
      progressFor(ASSEMBLY1_STEP2_DURATIONS.crossMemberClamp),
    );
    gripperTargets[2] = sharedTarget;
    gripperTargets[3] = sharedTarget;
  } else if (machine.phase === 'cross-member-verification') {
    gripperTargets[0] = clamps[0];
    gripperTargets[2] = clamps[2];
    gripperTargets[3] = clamps[3];
  } else if (machine.phase === 'hammer-clamp') {
    gripperTargets[0] = clamps[0];
    gripperTargets[1] = interpolateAssemblyStep2Gripper(
      255,
      clamps[1],
      progressFor(ASSEMBLY1_STEP2_DURATIONS.hammerClamp),
    );
    gripperTargets[2] = clamps[2];
    gripperTargets[3] = clamps[3];
  } else if (
    machine.phase === 'tool-verification'
    || machine.phase === 'clamped-hold'
    || machine.phase === 'complete'
  ) {
    for (let index = 0; index < gripperTargets.length; index += 1) {
      gripperTargets[index] = clamps[index];
    }
  }

  return {
    arms: plans.map((plan, index) => {
      let jointTargets = plan.contact;
      if (machine.phase === 'approach') {
        jointTargets = interpolateJointTargets(
          plan.start,
          plan.approach,
          progressFor(ASSEMBLY1_STEP2_DURATIONS.approach),
        );
      } else if (machine.phase === 'slow-descent') {
        jointTargets = interpolateJointTargets(
          plan.approach,
          plan.contact,
          progressFor(ASSEMBLY1_STEP2_DURATIONS.slowDescent),
        );
      }
      return {
        armKey: plan.armKey,
        jointTargets,
        gripperTarget: gripperTargets[index],
      };
    }),
  };
}

export function quaternionAngularDistanceDegrees(first, second) {
  const firstNorm = Math.hypot(...first);
  const secondNorm = Math.hypot(...second);
  if (firstNorm === 0 || secondNorm === 0) return Number.POSITIVE_INFINITY;
  const rawDot = first.reduce(
    (sum, value, index) => sum + value * second[index],
    0,
  ) / (firstNorm * secondNorm);
  const symmetricDot = Math.max(-1, Math.min(1, Math.abs(rawDot)));
  return 2 * Math.acos(symmetricDot) * 180 / Math.PI;
}

function failed(code, detail) {
  return detail === undefined ? { ok: false, code } : { ok: false, code, detail };
}

export function evaluateAssemblyStep2Grasp({
  targetBody,
  leftContactBodies,
  rightContactBodies,
  forbiddenBodies,
  aperture,
  translation,
  maximumTranslation = ASSEMBLY1_STEP2_LIMITS.objectTranslation,
  rotationDegrees,
  maximumRotationDegrees = ASSEMBLY1_STEP2_LIMITS.objectRotationDegrees,
  verticalDisplacement,
  maximumVerticalDisplacement = ASSEMBLY1_STEP2_LIMITS.verticalDisplacement,
  requireBilateralContact = true,
  leftTargetContactAge = Number.POSITIVE_INFINITY,
  rightTargetContactAge = Number.POSITIVE_INFINITY,
  leftTargetContactDistance = null,
  rightTargetContactDistance = null,
  minimumAperture = ASSEMBLY1_STEP2_LIMITS.minimumAperture,
  maximumContactPenetration = ASSEMBLY1_STEP2_LIMITS.maximumContactPenetration,
  contactComparisonEpsilon = ASSEMBLY1_STEP2_LIMITS.contactComparisonEpsilon,
}) {
  const leftContactIsRecent = leftTargetContactAge <= ASSEMBLY1_STEP2_DURATIONS.contactGrace;
  const rightContactIsRecent = rightTargetContactAge <= ASSEMBLY1_STEP2_DURATIONS.contactGrace;
  if (
    requireBilateralContact
    && !leftContactBodies.includes(targetBody)
    && !leftContactIsRecent
  ) {
    return failed('missing-left-contact');
  }
  if (
    requireBilateralContact
    && !rightContactBodies.includes(targetBody)
    && !rightContactIsRecent
  ) {
    return failed('missing-right-contact');
  }
  if (forbiddenBodies.length > 0) return failed('forbidden-contact', forbiddenBodies.join(', '));
  const contactDistances = [leftTargetContactDistance, rightTargetContactDistance]
    .filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (
    contactDistances.length > 0
    && Math.min(...contactDistances)
      < -(maximumContactPenetration + contactComparisonEpsilon)
  ) {
    return failed('deep-penetration', String(Math.min(...contactDistances)));
  }
  if (!(aperture > minimumAperture)) {
    return failed('empty-closure', String(aperture));
  }
  if (translation > maximumTranslation) {
    return failed('object-drift', String(translation));
  }
  if (rotationDegrees > maximumRotationDegrees) {
    return failed('object-rotation', String(rotationDegrees));
  }
  if (verticalDisplacement > maximumVerticalDisplacement) {
    return failed('object-lift', String(verticalDisplacement));
  }
  return { ok: true };
}

export function createAssemblyStep2Machine() {
  return {
    phase: 'approach',
    phaseElapsed: 0,
    continuousValidSeconds: 0,
    lastInvalidVerdict: null,
    failure: null,
  };
}

const timedTransitions = {
  approach: [ASSEMBLY1_STEP2_DURATIONS.approach, 'slow-descent'],
  'slow-descent': [ASSEMBLY1_STEP2_DURATIONS.slowDescent, 'contact-settle'],
  'contact-settle': [ASSEMBLY1_STEP2_DURATIONS.contactSettle, 'frame-clamp'],
  'frame-clamp': [ASSEMBLY1_STEP2_DURATIONS.frameClamp, 'frame-verification'],
  'cross-member-clamp': [
    ASSEMBLY1_STEP2_DURATIONS.crossMemberClamp,
    'cross-member-verification',
  ],
  'hammer-clamp': [
    ASSEMBLY1_STEP2_DURATIONS.hammerClamp,
    'tool-verification',
  ],
};

const verificationTransitions = {
  'frame-verification': ['frame', 'cross-member-clamp'],
  'cross-member-verification': ['crossMember', 'hammer-clamp'],
  'tool-verification': ['tool', 'clamped-hold'],
};

function enterPhase(phase) {
  return {
    phase,
    phaseElapsed: 0,
    continuousValidSeconds: 0,
    lastInvalidVerdict: null,
    failure: null,
  };
}

function terminalFailure(verdict) {
  return {
    phase: 'error',
    phaseElapsed: 0,
    continuousValidSeconds: 0,
    lastInvalidVerdict: null,
    failure: {
      code: verdict?.code ?? 'verification-timeout',
      ...(verdict?.armKey ? { armKey: verdict.armKey } : {}),
      ...(verdict?.detail ? { detail: verdict.detail } : {}),
    },
  };
}

export function advanceAssemblyStep2Machine(machine, deltaSeconds, evidence) {
  if (machine.phase === 'complete' || machine.phase === 'error') return machine;
  const dt = Math.max(0, deltaSeconds);
  const timedTransition = timedTransitions[machine.phase];
  if (timedTransition) {
    const [duration, nextPhase] = timedTransition;
    const phaseElapsed = machine.phaseElapsed + dt;
    return phaseElapsed >= duration
      ? enterPhase(nextPhase)
      : { ...machine, phaseElapsed };
  }

  const verificationTransition = verificationTransitions[machine.phase];
  if (verificationTransition) {
    const [evidenceKey, nextPhase] = verificationTransition;
    const verdict = evidence[evidenceKey];
    const phaseElapsed = machine.phaseElapsed + dt;
    const continuousValidSeconds = verdict?.ok
      ? machine.continuousValidSeconds + dt
      : 0;
    const lastInvalidVerdict = verdict?.ok
      ? (machine.lastInvalidVerdict ?? null)
      : verdict;
    if (continuousValidSeconds >= ASSEMBLY1_STEP2_DURATIONS.contactWindow) {
      return enterPhase(nextPhase);
    }
    if (phaseElapsed >= ASSEMBLY1_STEP2_DURATIONS.verificationTimeout) {
      return terminalFailure(verdict?.ok ? lastInvalidVerdict : verdict);
    }
    return {
      ...machine,
      phaseElapsed,
      continuousValidSeconds,
      lastInvalidVerdict,
    };
  }

  if (machine.phase === 'clamped-hold') {
    const verdict = evidence.all;
    if (!verdict?.ok) return terminalFailure(verdict);
    const continuousValidSeconds = machine.continuousValidSeconds + dt;
    if (continuousValidSeconds >= ASSEMBLY1_STEP2_DURATIONS.stableHold) {
      return enterPhase('complete');
    }
    return {
      ...machine,
      phaseElapsed: machine.phaseElapsed + dt,
      continuousValidSeconds,
    };
  }

  return machine;
}
