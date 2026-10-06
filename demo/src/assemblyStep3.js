import { interpolateJointTargets } from './assemblyStep1.js';
import { ASSEMBLY1_STEP2_ARMS } from './assemblyStep2.js';
import { FRANKA_HOME } from './sceneLayouts.js';
import { ASSEMBLY1_STEP3_PRECOMPUTED_PATHS } from './assemblyStep3Paths.js';

export const ASSEMBLY1_STEP3_DURATIONS = Object.freeze({
  graspCheckWindow: 0.25,
  verificationTimeout: 4,
  lift: 3,
  liftContactGrace: 1.2,
  transferA: 6.5,
  transferB: 6.5,
  alignedDescent: 3,
  alignedHold: 1,
  reseatLift: 1.2,
  reseatDescent: 1.5,
  release: 0.8,
  releaseSettle: 0.5,
  retreat: 3,
  placedHold: 1,
});

export const ASSEMBLY1_STEP3_GRIPPER_CLAMPS = Object.freeze([130, 130, 135, 130]);
export const ASSEMBLY1_STEP3_START_GRIPPER_CLAMPS = Object.freeze([130, 130, 135, 130]);
export const ASSEMBLY1_STEP3_HOME_JOINT_TARGETS = Object.freeze(FRANKA_HOME.slice(0, 7));

export const ASSEMBLY1_STEP3_HAMMER_WAYPOINTS = Object.freeze({
  start: Object.freeze([0.675, -0.421, 0.197]),
  prelift: Object.freeze([0.675, -0.421, 0.207]),
  lift: Object.freeze([0.675, -0.421, 0.257]),
  liftPath: Object.freeze([0.207, 0.217, 0.227, 0.237, 0.247, 0.257].map(
    (z) => Object.freeze([0.675, -0.421, z]),
  )),
  // Step 3 only clears the pickup cradle and holds a compact staging pose.
  // The actual donor-to-receiver transfer belongs to Step 4.
  handover: Object.freeze([0.675, -0.421, 0.257]),
  handoverPath: Object.freeze([Object.freeze([0.675, -0.421, 0.257])]),
});

export const ASSEMBLY1_STEP3_HAMMER_ARM = Object.freeze({
  key: 'r1',
  armIndex: 1,
  closingAxisYawDegrees: 90,
  preliftJointTargets: Object.freeze([
    1.663093, 0.382413, 0.916994, -2.442793, -0.613259, 2.598899, 2.300676,
  ]),
  liftJointTargets: Object.freeze([
    1.47825, 0.235116, 1.141209, -2.458871, -0.37648, 2.524016, 2.135577,
  ]),
  handoverJointTargets: Object.freeze([
    1.47825, 0.235116, 1.141209, -2.458871, -0.37648, 2.524016, 2.135577,
  ]),
  liftPathJointTargets: Object.freeze(Array.from({ length: 6 }, (_, index) => (
    Object.freeze(interpolateJointTargets(
      [1.663093, 0.382413, 0.916994, -2.442793, -0.613259, 2.598899, 2.300676],
      [1.47825, 0.235116, 1.141209, -2.458871, -0.37648, 2.524016, 2.135577],
      index / 5,
    ))
  ))),
});

export const ASSEMBLY1_STEP3_LIMITS = Object.freeze({
  minimumAperture: 0.035,
  hammerMinimumAperture: 0.018,
  crossMemberMinimumAperture: 0.035,
  maximumContactPenetration: 0.002,
  // The lightweight hammer's high-friction receiver surface settles about
  // 2.2 mm into the compliant pad model while remaining visibly well seated.
  hammerMaximumContactPenetration: 0.0025,
  frameMaximumContactPenetration: 0.0025,
  contactComparisonEpsilon: 0.00015,
  frameTranslation: 0.02,
  holePlanarDistance: 0.04,
  holeVerticalOffset: 0.025,
  seatedVerticalOffset: 0.02,
  comparisonEpsilon: 0.001,
});

export const ASSEMBLY1_STEP3_WAYPOINTS = Object.freeze({
  start: Object.freeze([
    Object.freeze([-0.489, 0.56, 0.21]),
    Object.freeze([-0.482, 0.32, 0.213]),
  ]),
  lift: Object.freeze([
    Object.freeze([-0.49, 0.5675, 0.38]),
    Object.freeze([-0.49, 0.3125, 0.38]),
  ]),
  transferA: Object.freeze([
    Object.freeze([-0.245, 0.3475, 0.38]),
    Object.freeze([-0.245, 0.0925, 0.38]),
  ]),
  transferMid: Object.freeze([
    Object.freeze([-0.1625, 0.2375, 0.37]),
    Object.freeze([-0.1625, -0.0175, 0.37]),
  ]),
  hover: Object.freeze([
    Object.freeze([-0.08, 0.1275, 0.34]),
    Object.freeze([-0.08, -0.1275, 0.34]),
  ]),
  descentMid: Object.freeze([
    Object.freeze([-0.08, 0.1275, 0.315]),
    Object.freeze([-0.08, -0.1275, 0.315]),
  ]),
  aligned: Object.freeze([
    Object.freeze([-0.074, 0.1275, 0.292]),
    Object.freeze([-0.078, -0.1275, 0.292]),
  ]),
});

export function selectAssemblyStep3HoldTarget(armIndex, measuredJointTargets) {
  // Arm 1 enters Step 3 while preloaded against the frame. Reusing the exact
  // Step 2 target preserves that preload; a measured snapshot releases it and
  // lets the frame oscillate. Other arms retain their measured transition pose.
  return armIndex === 0
    ? [...ASSEMBLY1_STEP2_ARMS[0].contactJointTargets]
    : [...measuredJointTargets];
}

export const ASSEMBLY1_STEP3_TRANSPORT_ARMS = Object.freeze([
  Object.freeze({
    key: 'r2',
    armIndex: 2,
    closingAxisYawDegrees: 0,
    liftJointTargets: Object.freeze([
      1.400881, -0.646883, -0.427827, -2.771807, -0.30315, 2.148747, -2.705984,
    ]),
    transferAJointTargets: Object.freeze([
      1.771081, -0.06638, -0.090561, -2.287666, -0.007183, 2.22276, -2.242054,
    ]),
    transferMidJointTargets: Object.freeze([
      1.82773, 0.292618, -0.039414, -1.841197, 0.013564, 2.135377, -2.144295,
    ]),
    hoverJointTargets: Object.freeze([
      1.876893, 0.762889, -0.016208, -1.16687, 0.011966, 1.931089, -2.066018,
    ]),
    descentMidJointTargets: Object.freeze([
      1.876859, 0.78801, -0.015961, -1.187039, 0.012298, 1.973843, -2.066222,
    ]),
    alignedJointTargets: Object.freeze([
      1.883582, 0.816862, -0.014614, -1.196937, 0.011868, 2.013246, -2.058572,
    ]),
    ...ASSEMBLY1_STEP3_PRECOMPUTED_PATHS.r2,
  }),
  Object.freeze({
    key: 'r3',
    armIndex: 3,
    closingAxisYawDegrees: 0,
    liftJointTargets: Object.freeze([
      2.718918, -0.274179, -0.352746, -2.494008, -0.118746, 2.233089, 0.09526,
    ]),
    transferAJointTargets: Object.freeze([
      2.467493, 0.129741, -0.750092, -2.085143, 0.106867, 2.178559, -0.695436,
    ]),
    transferMidJointTargets: Object.freeze([
      2.201028, 0.422584, -0.746279, -1.785715, 0.324699, 2.082097, -1.01876,
    ]),
    hoverJointTargets: Object.freeze([
      1.854169, 0.769157, -0.662157, -1.323138, 0.475428, 1.936001, -1.193745,
    ]),
    descentMidJointTargets: Object.freeze([
      1.850025, 0.797105, -0.649911, -1.339989, 0.490205, 1.975565, -1.20185,
    ]),
    alignedJointTargets: Object.freeze([
      1.843182, 0.82844, -0.636634, -1.345833, 0.505462, 2.011413, -1.208399,
    ]),
    ...ASSEMBLY1_STEP3_PRECOMPUTED_PATHS.r3,
  }),
]);

function failure(code, detail) {
  return detail === undefined ? { ok: false, code } : { ok: false, code, detail };
}

export function evaluateAssemblyStep3Transport({
  targetBody,
  leftContactBodies,
  rightContactBodies,
  forbiddenBodies,
  aperture,
  leftTargetContactDistance = null,
  rightTargetContactDistance = null,
  requireBilateralContact = true,
  minimumAperture = ASSEMBLY1_STEP3_LIMITS.minimumAperture,
  maximumContactPenetration = ASSEMBLY1_STEP3_LIMITS.maximumContactPenetration,
  contactComparisonEpsilon = ASSEMBLY1_STEP3_LIMITS.contactComparisonEpsilon,
}) {
  if (!Number.isFinite(aperture)) return failure('non-finite-runtime');
  if (requireBilateralContact && !leftContactBodies.includes(targetBody)) {
    return failure('missing-left-contact');
  }
  if (requireBilateralContact && !rightContactBodies.includes(targetBody)) {
    return failure('missing-right-contact');
  }
  if (forbiddenBodies.length > 0) return failure('forbidden-contact', forbiddenBodies.join(', '));
  const contactDistances = [leftTargetContactDistance, rightTargetContactDistance]
    .filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (
    contactDistances.length > 0
    && Math.min(...contactDistances)
      < -(maximumContactPenetration + contactComparisonEpsilon)
  ) {
    return failure('deep-penetration', String(Math.min(...contactDistances)));
  }
  if (!(aperture > minimumAperture)) {
    return failure('empty-closure', String(aperture));
  }
  return { ok: true };
}

export function evaluateAssemblyStep3Alignment({
  holePlanarDistances,
  holeVerticalOffsets,
  frameTranslation,
  crossMemberRotationDegrees,
  planarTolerance = ASSEMBLY1_STEP3_LIMITS.holePlanarDistance,
  verticalTolerance = ASSEMBLY1_STEP3_LIMITS.holeVerticalOffset,
}) {
  if (
    holePlanarDistances.length !== 4
    || holeVerticalOffsets.length !== 4
    || !holePlanarDistances.every(Number.isFinite)
    || !holeVerticalOffsets.every(Number.isFinite)
    || !Number.isFinite(frameTranslation)
    || !Number.isFinite(crossMemberRotationDegrees)
  ) {
    return failure('non-finite-runtime');
  }
  const maximumPlanarDistance = Math.max(...holePlanarDistances);
  if (maximumPlanarDistance > planarTolerance + ASSEMBLY1_STEP3_LIMITS.comparisonEpsilon) {
    return failure('hole-misalignment', String(maximumPlanarDistance));
  }
  const maximumVerticalOffset = Math.max(...holeVerticalOffsets);
  if (maximumVerticalOffset > verticalTolerance + ASSEMBLY1_STEP3_LIMITS.comparisonEpsilon) {
    return failure('hole-height', String(maximumVerticalOffset));
  }
  if (frameTranslation > ASSEMBLY1_STEP3_LIMITS.frameTranslation) {
    return failure('frame-drift', String(frameTranslation));
  }
  return { ok: true };
}

export function createAssemblyStep3Machine() {
  return {
    phase: 'grasp-check',
    phaseElapsed: 0,
    continuousValidSeconds: 0,
    reseatAttempts: 0,
    failure: null,
  };
}

function enterPhase(phase, reseatAttempts = 0) {
  return {
    phase,
    phaseElapsed: 0,
    continuousValidSeconds: 0,
    reseatAttempts,
    failure: null,
  };
}

function terminalFailure(verdict) {
  return {
    phase: 'error',
    phaseElapsed: 0,
    continuousValidSeconds: 0,
    failure: {
      code: verdict?.code ?? 'verification-timeout',
      ...(verdict?.armKey ? { armKey: verdict.armKey } : {}),
      ...(verdict?.detail ? { detail: verdict.detail } : {}),
    },
  };
}

function combinedEvidence(evidence, includeAlignment = false) {
  if (!evidence.all?.ok) return evidence.all;
  if (includeAlignment && !evidence.alignment?.ok) return evidence.alignment;
  return { ok: true };
}

const motionTransitions = {
  lift: [ASSEMBLY1_STEP3_DURATIONS.lift, 'lift-settle', false],
  'transfer-a': [ASSEMBLY1_STEP3_DURATIONS.transferA, 'transfer-b', false],
  'transfer-b': [ASSEMBLY1_STEP3_DURATIONS.transferB, 'hover-settle', false],
  'aligned-descent': [
    ASSEMBLY1_STEP3_DURATIONS.alignedDescent,
    'alignment-verification',
    false,
  ],
  'reseat-lift': [ASSEMBLY1_STEP3_DURATIONS.reseatLift, 'reseat-descent', false],
  'reseat-descent': [
    ASSEMBLY1_STEP3_DURATIONS.reseatDescent,
    'alignment-verification',
    false,
  ],
  release: [ASSEMBLY1_STEP3_DURATIONS.release, 'release-settle', false],
  'release-settle': [ASSEMBLY1_STEP3_DURATIONS.releaseSettle, 'retreat', false],
  retreat: [ASSEMBLY1_STEP3_DURATIONS.retreat, 'placed-verification', false],
};

const verificationTransitions = {
  'grasp-check': ['lift', false],
  'lift-settle': ['transfer-a', false],
  'hover-settle': ['aligned-descent', false],
  'alignment-verification': ['aligned-hold', true],
};

export function advanceAssemblyStep3Machine(machine, deltaSeconds, evidence) {
  if (machine.phase === 'error') return machine;
  if (machine.phase === 'complete') {
    return evidence.all?.ok ? machine : terminalFailure(evidence.all);
  }
  const dt = Math.max(0, deltaSeconds);
  const motionTransition = motionTransitions[machine.phase];
  if (motionTransition) {
    const [duration, nextPhase, includeAlignment] = motionTransition;
    const releasingCrossMember = ['release', 'release-settle', 'retreat'].includes(machine.phase);
    const verdict = releasingCrossMember
      ? { ok: true }
      : combinedEvidence(evidence, includeAlignment);
    const liftIsRecovering = machine.phase === 'lift'
      && machine.phaseElapsed < ASSEMBLY1_STEP3_DURATIONS.liftContactGrace;
    if (!verdict?.ok && !liftIsRecovering) return terminalFailure(verdict);
    const phaseElapsed = machine.phaseElapsed + dt;
    return phaseElapsed >= duration
      ? enterPhase(nextPhase, machine.reseatAttempts ?? 0)
      : { ...machine, phaseElapsed };
  }

  const verificationTransition = verificationTransitions[machine.phase];
  if (verificationTransition) {
    const [nextPhase, includeAlignment] = verificationTransition;
    const verdict = combinedEvidence(evidence, includeAlignment);
    const phaseElapsed = machine.phaseElapsed + dt;
    const continuousValidSeconds = verdict?.ok
      ? machine.continuousValidSeconds + dt
      : 0;
    if (continuousValidSeconds >= ASSEMBLY1_STEP3_DURATIONS.graspCheckWindow) {
      return enterPhase(nextPhase, machine.reseatAttempts ?? 0);
    }
    if (phaseElapsed >= ASSEMBLY1_STEP3_DURATIONS.verificationTimeout) {
      if (
        machine.phase === 'alignment-verification'
        && (machine.reseatAttempts ?? 0) < 1
        && evidence.all?.ok
      ) {
        return enterPhase('reseat-lift', 1);
      }
      return terminalFailure(verdict);
    }
    return { ...machine, phaseElapsed, continuousValidSeconds };
  }

  if (machine.phase === 'aligned-hold') {
    const verdict = combinedEvidence(evidence, true);
    if (!verdict?.ok) return terminalFailure(verdict);
    const continuousValidSeconds = machine.continuousValidSeconds + dt;
    if (continuousValidSeconds >= ASSEMBLY1_STEP3_DURATIONS.alignedHold) {
      return enterPhase('release', machine.reseatAttempts ?? 0);
    }
    return {
      ...machine,
      phaseElapsed: machine.phaseElapsed + dt,
      continuousValidSeconds,
    };
  }

  if (machine.phase === 'placed-verification') {
    const verdict = combinedEvidence(evidence, true);
    if (!verdict?.ok) return terminalFailure(verdict);
    const continuousValidSeconds = machine.continuousValidSeconds + dt;
    if (continuousValidSeconds >= ASSEMBLY1_STEP3_DURATIONS.placedHold) {
      return enterPhase('complete', machine.reseatAttempts ?? 0);
    }
    return {
      ...machine,
      phaseElapsed: machine.phaseElapsed + dt,
      continuousValidSeconds,
    };
  }

  return machine;
}

export function createAssemblyStep3ControlFrame(machine, plans) {
  const progress = (duration) => machine.phaseElapsed / duration;
  const pathTarget = (path, value) => {
    const clamped = Math.max(0, Math.min(1, value));
    const scaled = clamped * Math.max(0, path.length - 1);
    const index = Math.min(path.length - 1, Math.floor(scaled));
    const next = Math.min(path.length - 1, index + 1);
    return interpolateJointTargets(path[index], path[next], scaled - index);
  };
  return {
    arms: plans.map((plan, index) => {
      let jointTargets = plan.hold;
      if (index === 1) {
        if (machine.phase === 'lift') {
          jointTargets = pathTarget(
            plan.hammerLiftPath ?? [plan.hold, plan.hammerPrelift, plan.hammerLift],
            progress(ASSEMBLY1_STEP3_DURATIONS.lift),
          );
        } else if (machine.phase === 'lift-settle') {
          jointTargets = plan.hammerLift;
        } else if (machine.phase === 'transfer-a') {
          jointTargets = pathTarget(
            plan.hammerHandoverPath ?? [plan.hammerLift, plan.hammerHandover],
            progress(ASSEMBLY1_STEP3_DURATIONS.transferA),
          );
        } else if (machine.phase !== 'grasp-check') {
          jointTargets = plan.hammerHandover;
        }
      } else if (index >= 2) {
        if (machine.phase === 'lift') {
          jointTargets = pathTarget(
            plan.transportLiftPath ?? [plan.hold, plan.lift],
            progress(ASSEMBLY1_STEP3_DURATIONS.lift),
          );
        } else if (machine.phase === 'lift-settle') {
          jointTargets = plan.lift;
        } else if (machine.phase === 'transfer-a') {
          jointTargets = pathTarget(
            plan.transportAPath ?? [plan.lift, plan.transferA],
            progress(ASSEMBLY1_STEP3_DURATIONS.transferA),
          );
        } else if (machine.phase === 'transfer-b') {
          const transferProgress = progress(ASSEMBLY1_STEP3_DURATIONS.transferB);
          jointTargets = plan.transportBPath
            ? pathTarget(plan.transportBPath, transferProgress)
            : transferProgress < 0.5
              ? interpolateJointTargets(plan.transferA, plan.transferMid, transferProgress * 2)
              : interpolateJointTargets(plan.transferMid, plan.hover, (transferProgress - 0.5) * 2);
        } else if (machine.phase === 'hover-settle') {
          jointTargets = plan.hover;
        } else if (machine.phase === 'aligned-descent') {
          const descentProgress = progress(ASSEMBLY1_STEP3_DURATIONS.alignedDescent);
          jointTargets = plan.transportDescentPath
            ? pathTarget(plan.transportDescentPath, descentProgress)
            : descentProgress < 0.5
              ? interpolateJointTargets(plan.hover, plan.descentMid, descentProgress * 2)
              : interpolateJointTargets(plan.descentMid, plan.aligned, (descentProgress - 0.5) * 2);
        } else if (machine.phase === 'reseat-lift') {
          jointTargets = interpolateJointTargets(
            plan.aligned,
            plan.descentMid,
            progress(ASSEMBLY1_STEP3_DURATIONS.reseatLift),
          );
        } else if (machine.phase === 'reseat-descent') {
          jointTargets = interpolateJointTargets(
            plan.descentMid,
            plan.aligned,
            progress(ASSEMBLY1_STEP3_DURATIONS.reseatDescent),
          );
        } else if (machine.phase === 'retreat') {
          jointTargets = interpolateJointTargets(
            plan.aligned,
            plan.home,
            progress(ASSEMBLY1_STEP3_DURATIONS.retreat),
          );
        } else if (
          machine.phase === 'alignment-verification'
          || machine.phase === 'aligned-hold'
          || machine.phase === 'release'
          || machine.phase === 'release-settle'
        ) {
          jointTargets = plan.aligned;
        } else if (machine.phase === 'placed-verification' || machine.phase === 'complete') {
          jointTargets = plan.home;
        }
      }
      let gripperTarget = ASSEMBLY1_STEP3_GRIPPER_CLAMPS[index];
      if (index >= 2 && machine.phase === 'release') {
        gripperTarget = interpolateJointTargets(
          [ASSEMBLY1_STEP3_GRIPPER_CLAMPS[index]],
          [255],
          progress(ASSEMBLY1_STEP3_DURATIONS.release),
        )[0];
      } else if (
        index >= 2
        && ['release-settle', 'retreat', 'placed-verification', 'complete'].includes(machine.phase)
      ) {
        gripperTarget = 255;
      }
      return {
        armKey: plan.armKey,
        jointTargets,
        gripperTarget,
      };
    }),
  };
}

export function holdAssemblyStep3Controls(controls, positions, arms) {
  for (const arm of arms) {
    for (let joint = 0; joint < arm.actuatorIndices.length; joint += 1) {
      controls[arm.actuatorIndices[joint]] = positions[arm.qposAddresses[joint]];
    }
  }
}
