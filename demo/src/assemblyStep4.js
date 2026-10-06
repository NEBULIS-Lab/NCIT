import { interpolateJointTargets } from './assemblyStep1.js';
import { ASSEMBLY1_STEP2_ARMS } from './assemblyStep2.js';
import {
  ASSEMBLY1_STEP3_HAMMER_ARM,
  ASSEMBLY1_STEP3_HOME_JOINT_TARGETS,
} from './assemblyStep3.js';

export const ASSEMBLY1_STEP4_DURATIONS = Object.freeze({
  donorTighten: 1.2,
  prepare: 3,
  engage: 6,
  engageSettle: 3,
  receiverAlign: 3,
  dualClamp: 4,
  // Keep both wrists stationary until the donor fingers physically clear.
  hammerRelease: 2,
  donorClear: 3,
  receiverRetreat: 5,
  fastenerTighten: 5,
  // MuJoCo's finger joints lag the actuator command.  Hold the pickup pose
  // after closing so the real pads can settle on both sides before any lift.
  fastenerGripSettle: 2,
  fastenerVerificationWindow: 0.4,
  fastenerVerificationTimeout: 3,
  // Require a sustained bilateral grasp before the donor opens.  A single
  // contact frame is not a handover and previously allowed the hammer to fall.
  verificationWindow: 0.5,
  contactGrace: 0.12,
  verificationTimeout: 4,
  lift: 6,
  transfer: 3,
  transferSettle: 2,
  insert: 5,
  fastenerRelease: 1.5,
  clear: 2,
  placementHold: 1,
  placementTimeout: 4,
  hammerStage: 4,
  hammerStrike: 0.9,
  hammerRecover: 1.2,
  supportApproach: 4,
  supportClamp: 3,
  supportRelease: 2,
  supportClear: 3,
  returnHome: 6,
  hammerReturn: 5,
  hammerLower: 3,
  toolRelease: 2,
  toolClear: 3,
});

export const ASSEMBLY1_STEP4_LIMITS = Object.freeze({
  minimumFastenerAperture: 0.005,
  minimumToolAperture: 0.018,
  // Require closed fingers, real mesh contact and proximity to the visible
  // grip center together; aperture alone cannot establish a grasp.
  maximumToolAperture: 0.052,
  maximumContactPenetration: 0.002,
  contactComparisonEpsilon: 0.0003,
  // Reject edge-only grasps, even when the source mesh has bilateral contact.
  maximumHammerGraspPointDistance: 0.016,
  frameTranslation: 0.012,
  crossMemberTranslation: 0.025,
  crossMemberRotationDegrees: 12,
  fastenerPlanarDistance: 0.018,
  fastenerMinimumHeight: 0.275,
  fastenerMaximumHeight: 0.34,
  comparisonEpsilon: 0.0005,
  rotationComparisonEpsilonDegrees: 0.5,
});

export const ASSEMBLY1_STEP4_GRIPPERS = Object.freeze({
  frame: 130,
  donorEntry: 130,
  tool: 80,
  // Close against the actual curved source mesh; there are no added ribs.
  receiverTool: 50,
  // Grip the broad 30 mm head.  This avoids driving the narrow 14 mm shaft
  // sideways inside its passive fixture and provides a larger friction area.
  pregrasp: 80,
  // Command below the 30 mm head width so the Panda tendon maintains about
  // 2 N of normal clamping force instead of merely holding its contact pose.
  fastener: 80,
  open: 255,
});

// Rotating the user's recorded Arm 1/3 close-pair pose by 90 degrees maps it
// onto the east/west Arm 2/4 handover. The TCPs stay near the handle while the
// wrists lean away from one another, creating clearance without moving parts.
export const ASSEMBLY1_STEP4_HANDOVER_TCP_QUATERNIONS = Object.freeze({
  r1: Object.freeze([-0.058574, 0.954457, 0.054171, -0.287482]),
  r3: Object.freeze([0.957426, 0.019017, 0.284744, 0.043533]),
});

export const ASSEMBLY1_STEP4_WAYPOINTS = Object.freeze({
  r1: Object.freeze({
    // Lift clear of Arm 1's south-frame hold before crossing to the handover.
    prepare: Object.freeze([0.48, -0.28, 0.56]),
    engage: Object.freeze([0.088, 0.051, 0.36]),
    clear: Object.freeze([0.46, -0.10, 0.45]),
  }),
  r2: Object.freeze({
    // The Panda TCP is roughly 30 mm behind the physical finger pads in this
    // orientation.  Offset south and slightly west so both pads close around
    // the 30 mm fastener head instead of one pad sweeping it aside.
    prepare: Object.freeze([0.095, 0.368, 0.34]),
    // Align the full-height Panda pads with both sides of the fastener head.
    engage: Object.freeze([0.095, 0.368, 0.195]),
    lift: Object.freeze([0.095, 0.368, 0.40]),
    liftPath: Object.freeze([0.215, 0.235, 0.26, 0.285, 0.315, 0.345, 0.3725, 0.40].map(
      (z) => Object.freeze([0.095, 0.368, z]),
    )),
    transfer: Object.freeze([-0.12, 0.215, 0.43]),
    insert: Object.freeze([-0.12, 0.215, 0.385]),
    clear: Object.freeze([-0.10, 0.35, 0.44]),
  }),
  r3: Object.freeze({
    // The two arm bases have only a narrow shared workspace.  A lower exchange
    // pose keeps both wrists inside the Panda reach envelope while remaining
    // above the installed frame.
    // The west arm is already at its reachable boundary.  Keep its proven IK
    // branch and move the donor's exchange pose toward it instead, placing
    // both receiver fingers inside the visible main handle.
    prepare: Object.freeze([0.001, 0.022, 0.46]),
    engage: Object.freeze([0.02, 0.034, 0.38]),
    // Retreat horizontally toward the west base while preserving grasp
    // height.  Raising 90 mm at the tail grip made the handle slide downward
    // even though both pads remained force-closed.
    clear: Object.freeze([-0.08, 0.02, 0.421]),
    ready: Object.freeze([-0.33, 0.215, 0.41]),
    strike: Object.freeze([-0.33, 0.215, 0.35]),
  }),
});

const holds = [
  [...ASSEMBLY1_STEP2_ARMS[0].contactJointTargets],
  [...ASSEMBLY1_STEP3_HAMMER_ARM.handoverJointTargets],
  [...ASSEMBLY1_STEP3_HOME_JOINT_TARGETS],
  [...ASSEMBLY1_STEP3_HOME_JOINT_TARGETS],
];

function targets(hold, overrides = {}) {
  return Object.freeze({
    hold: Object.freeze([...hold]),
    prepare: Object.freeze([...(overrides.prepare ?? hold)]),
    engage: Object.freeze([...(overrides.engage ?? overrides.prepare ?? hold)]),
    lift: Object.freeze([...(overrides.lift ?? overrides.engage ?? overrides.prepare ?? hold)]),
    transfer: Object.freeze([...(overrides.transfer ?? overrides.lift ?? hold)]),
    insert: Object.freeze([...(overrides.insert ?? overrides.transfer ?? hold)]),
    clear: Object.freeze([...(overrides.clear ?? overrides.insert ?? hold)]),
    ready: Object.freeze([...(overrides.ready ?? overrides.clear ?? hold)]),
    strike: Object.freeze([...(overrides.strike ?? overrides.ready ?? overrides.clear ?? hold)]),
  });
}

// The recorded targets are generated and checked by scripts/solve-assembly-step4-waypoints.mjs.
export const ASSEMBLY1_STEP4_ARMS = Object.freeze([
  Object.freeze({
    key: 'r0',
    armIndex: 0,
    role: 'frame hold',
    jointTargets: targets(holds[0]),
  }),
  Object.freeze({
    key: 'r1',
    armIndex: 1,
    role: 'hammer handover donor',
    closingAxisYawDegrees: 90,
    jointTargets: targets(holds[1], {
      prepare: [1.030521, -0.350888, 0.969274, -1.929556, 0.289892, 1.717324, 1.141062],
      engage: [1.02131, 0.784901, 0.625989, -1.444251, -0.828269, 2.619197, 1.082857],
      clear: [0.97124, -0.427577, 0.749554, -2.342614, 0.317011, 2.0028, 0.752299],
    }),
  }),
  Object.freeze({
    key: 'r2',
    armIndex: 2,
    role: 'fastener pickup and insertion',
    jointTargets: targets(holds[2], {
      prepare: [0.017656, -0.547799, 2.117611, -1.864598, 0.542064, 2.103129, -2.015052],
      engage: [-0.135986, -0.769199, 2.335743, -1.889583, 0.756709, 2.322619, -2.13635],
      lift: [0.057474, -0.473012, 2.055218, -1.802036, 0.458798, 1.995036, -1.965205],
      transfer: [-0.466614, -0.575639, 2.089565, -1.583993, 0.515133, 1.856688, -2.38293],
      insert: [-0.478007, -0.617187, 2.122525, -1.641888, 0.555504, 1.937334, -2.407451],
      clear: [0.19281, 0.143248, 1.800162, -2.079169, -0.156084, 2.039899, -1.860655],
    }),
    liftPathJointTargets: Object.freeze([
      [-0.115714, -0.735541, 2.306111, -1.895171, 0.728403, 2.295944, -2.1219],
      [-0.094057, -0.702417, 2.275396, -1.898393, 0.698266, 2.26805, -2.10529],
      [-0.067505, -0.662383, 2.237535, -1.898143, 0.660272, 2.232016, -2.084196],
      [-0.041529, -0.624041, 2.200385, -1.89273, 0.621845, 2.193943, -2.06231],
      [-0.011915, -0.580272, 2.157813, -1.879758, 0.576512, 2.146247, -2.036214],
      [0.015602, -0.539331, 2.117971, -1.859241, 0.532428, 2.09554, -2.010155],
      [0.038167, -0.504651, 2.084702, -1.833727, 0.494127, 2.046392, -1.98698],
      [0.057474, -0.473012, 2.055218, -1.802036, 0.458798, 1.995036, -1.965205],
    ].map((target) => Object.freeze(target))),
  }),
  Object.freeze({
    key: 'r3',
    armIndex: 3,
    role: 'hammer handover receiver and strike',
    // Swap the symmetric parallel-gripper fingers to stay on the home-side IK
    // branch.  The TCP positions and physical hammer closing axis are unchanged.
    closingAxisYawDegrees: -90,
    jointTargets: targets(holds[3], {
      prepare: [1.881565, 0.549929, -0.343027, -1.461157, 0.122962, 2.561078, 0.730321],
      engage: [1.86868, 0.696841, -0.316474, -1.429496, 0.149974, 2.672418, 0.743031],
      clear: [1.979088, 0.338598, -0.39832, -1.89208, 0.059341, 2.780917, 0.764135],
      ready: [2.416424, -0.077192, -0.40999, -2.21052, -0.036876, 2.141526, 1.242034],
      strike: [2.41656, 0.010969, -0.416895, -2.280203, 0.005007, 2.289873, 1.211271],
    }),
  }),
]);

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
    failure: {
      code: verdict?.code ?? 'verification-timeout',
      ...(verdict?.armKey ? { armKey: verdict.armKey } : {}),
      ...(verdict?.detail ? { detail: verdict.detail } : {}),
    },
  };
}

export function createAssemblyStep4Machine() {
  return enterPhase('donor-tighten');
}

function combinedEvidence(
  evidence,
  needFastenerGrasp = false,
  needPlacement = false,
  needHammerGrasp = false,
) {
  if (!evidence.all?.ok) return evidence.all;
  if (needFastenerGrasp && !evidence.fastenerGrasp?.ok) return evidence.fastenerGrasp;
  if (needHammerGrasp && !evidence.hammerGrasp?.ok) return evidence.hammerGrasp;
  if (needPlacement && !evidence.placement?.ok) return evidence.placement;
  return { ok: true };
}

const timedTransitions = {
  'donor-tighten': [ASSEMBLY1_STEP4_DURATIONS.donorTighten, 'prepare', false, false, false],
  prepare: [ASSEMBLY1_STEP4_DURATIONS.prepare, 'engage', false, false, false],
  engage: [ASSEMBLY1_STEP4_DURATIONS.engage, 'engage-settle', false, false, false],
  'engage-settle': [ASSEMBLY1_STEP4_DURATIONS.engageSettle, 'receiver-align', false, false, false],
  'receiver-align': [ASSEMBLY1_STEP4_DURATIONS.receiverAlign, 'dual-clamp', false, false, false],
  'dual-clamp': [ASSEMBLY1_STEP4_DURATIONS.dualClamp, 'handover-verification', false, false, false],
  'hammer-release': [ASSEMBLY1_STEP4_DURATIONS.hammerRelease, 'donor-clear', false, false, true],
  'donor-clear': [ASSEMBLY1_STEP4_DURATIONS.donorClear, 'receiver-retreat', false, false, true],
  'receiver-retreat': [ASSEMBLY1_STEP4_DURATIONS.receiverRetreat, 'fastener-tighten', false, false, true],
  'fastener-tighten': [
    ASSEMBLY1_STEP4_DURATIONS.fastenerTighten,
    'fastener-grip-settle',
    false,
    false,
    true,
  ],
  'fastener-grip-settle': [
    ASSEMBLY1_STEP4_DURATIONS.fastenerGripSettle,
    'fastener-grasp-verification',
    false,
    false,
    true,
  ],
  lift: [ASSEMBLY1_STEP4_DURATIONS.lift, 'transfer', true, false, true],
  transfer: [ASSEMBLY1_STEP4_DURATIONS.transfer, 'transfer-settle', true, false, true],
  'transfer-settle': [ASSEMBLY1_STEP4_DURATIONS.transferSettle, 'insert', true, false, true],
  insert: [ASSEMBLY1_STEP4_DURATIONS.insert, 'fastener-release', true, false, true],
  'fastener-release': [
    ASSEMBLY1_STEP4_DURATIONS.fastenerRelease,
    'clear',
    false,
    false,
    true,
  ],
  clear: [ASSEMBLY1_STEP4_DURATIONS.clear, 'placement-verification', false, false, true],
  'hammer-stage': [ASSEMBLY1_STEP4_DURATIONS.hammerStage, 'hammer-strike', false, true, true],
  'hammer-strike': [ASSEMBLY1_STEP4_DURATIONS.hammerStrike, 'hammer-recover', false, true, true],
  'support-approach': [ASSEMBLY1_STEP4_DURATIONS.supportApproach, 'support-clamp', false, true, true],
  'support-clamp': [ASSEMBLY1_STEP4_DURATIONS.supportClamp, 'hammer-stage', false, true, true],
  'hammer-recover': [ASSEMBLY1_STEP4_DURATIONS.hammerRecover, 'support-release', false, true, true],
  'support-release': [ASSEMBLY1_STEP4_DURATIONS.supportRelease, 'support-clear', false, true, true],
  'support-clear': [ASSEMBLY1_STEP4_DURATIONS.supportClear, 'hammer-return', false, true, true],
  'hammer-return': [ASSEMBLY1_STEP4_DURATIONS.hammerReturn, 'hammer-lower', false, true, true],
  'hammer-lower': [ASSEMBLY1_STEP4_DURATIONS.hammerLower, 'tool-release', false, true, true],
  'tool-release': [ASSEMBLY1_STEP4_DURATIONS.toolRelease, 'tool-clear', false, true, false],
  'tool-clear': [ASSEMBLY1_STEP4_DURATIONS.toolClear, 'return-home', false, true, false],
  'return-home': [ASSEMBLY1_STEP4_DURATIONS.returnHome, 'complete', false, true, false],
};

export function advanceAssemblyStep4Machine(machine, deltaSeconds, evidence) {
  if (machine.phase === 'complete' || machine.phase === 'error') return machine;
  const dt = Math.max(0, deltaSeconds);
  const timed = timedTransitions[machine.phase];
  if (timed) {
    const [duration, nextPhase, needFastenerGrasp, needPlacement, needHammerGrasp] = timed;
    const verdict = combinedEvidence(
      evidence,
      needFastenerGrasp,
      needPlacement,
      needHammerGrasp,
    );
    if (!verdict?.ok) return terminalFailure(verdict);
    const phaseElapsed = machine.phaseElapsed + dt;
    return phaseElapsed >= duration ? enterPhase(nextPhase) : { ...machine, phaseElapsed };
  }

  if (machine.phase === 'handover-verification') {
    const verdict = combinedEvidence(evidence, false, false, true);
    const phaseElapsed = machine.phaseElapsed + dt;
    const continuousValidSeconds = verdict?.ok
      ? machine.continuousValidSeconds + dt
      : 0;
    const lastInvalidVerdict = verdict?.ok ? machine.lastInvalidVerdict : verdict;
    if (continuousValidSeconds >= ASSEMBLY1_STEP4_DURATIONS.verificationWindow) {
      return enterPhase('hammer-release');
    }
    if (phaseElapsed >= ASSEMBLY1_STEP4_DURATIONS.verificationTimeout) {
      return terminalFailure(verdict?.ok ? lastInvalidVerdict : verdict);
    }
    return { ...machine, phaseElapsed, continuousValidSeconds, lastInvalidVerdict };
  }

  if (machine.phase === 'fastener-grasp-verification') {
    const currentFastenerEvidence = evidence.fastenerCurrentGrasp
      ?? evidence.fastenerGrasp;
    const verdict = combinedEvidence({
      ...evidence,
      fastenerGrasp: currentFastenerEvidence,
    }, true, false, true);
    const phaseElapsed = machine.phaseElapsed + dt;
    const continuousValidSeconds = verdict?.ok
      ? machine.continuousValidSeconds + dt
      : 0;
    const lastInvalidVerdict = verdict?.ok ? machine.lastInvalidVerdict : verdict;
    if (continuousValidSeconds >= ASSEMBLY1_STEP4_DURATIONS.fastenerVerificationWindow) {
      return enterPhase('lift');
    }
    if (phaseElapsed >= ASSEMBLY1_STEP4_DURATIONS.fastenerVerificationTimeout) {
      return terminalFailure(verdict?.ok ? lastInvalidVerdict : verdict);
    }
    return { ...machine, phaseElapsed, continuousValidSeconds, lastInvalidVerdict };
  }

  if (machine.phase === 'placement-verification') {
    const verdict = combinedEvidence(evidence, false, true, true);
    const phaseElapsed = machine.phaseElapsed + dt;
    const continuousValidSeconds = verdict?.ok ? machine.continuousValidSeconds + dt : 0;
    const lastInvalidVerdict = verdict?.ok ? machine.lastInvalidVerdict : verdict;
    if (continuousValidSeconds >= ASSEMBLY1_STEP4_DURATIONS.placementHold) {
      return enterPhase('support-approach');
    }
    if (phaseElapsed >= ASSEMBLY1_STEP4_DURATIONS.placementTimeout) {
      return terminalFailure(verdict?.ok ? lastInvalidVerdict : verdict);
    }
    return {
      ...machine,
      phaseElapsed,
      continuousValidSeconds,
      lastInvalidVerdict,
    };
  }

  return machine;
}

function phaseTargets(machine, plan) {
  const progress = (duration) => machine.phaseElapsed / duration;
  const pathTarget = (path, value) => {
    const clamped = Math.max(0, Math.min(1, value));
    const eased = clamped ** 3 * (10 - 15 * clamped + 6 * clamped ** 2);
    const scaled = eased * Math.max(0, path.length - 1);
    const index = Math.min(path.length - 1, Math.floor(scaled));
    const next = Math.min(path.length - 1, index + 1);
    return path[index].map((q,j)=>q+(path[next][j]-q)*(scaled-index));
  };
  if (plan.phasePaths?.[machine.phase]) {
    return pathTarget(plan.phasePaths[machine.phase], progress(timedTransitions[machine.phase]?.[0] ?? 1));
  }
  if (machine.phase === 'complete') return ASSEMBLY1_STEP3_HOME_JOINT_TARGETS;
  if (machine.phase === 'receiver-retreat') {
    return plan.armKey === 'r3'
      ? interpolateJointTargets(plan.engage, ASSEMBLY1_STEP3_HOME_JOINT_TARGETS, progress(ASSEMBLY1_STEP4_DURATIONS.receiverRetreat))
      : plan.armKey === 'r1' ? plan.clear : plan.armKey === 'r2' ? plan.prepare : plan.hold;
  }
  if (plan.armKey === 'r3' && ['fastener-tighten', 'fastener-grip-settle', 'fastener-grasp-verification', 'lift', 'transfer', 'transfer-settle', 'insert', 'fastener-release', 'clear', 'placement-verification', 'support-approach', 'support-clamp'].includes(machine.phase)) {
    return plan.wait ?? ASSEMBLY1_STEP3_HOME_JOINT_TARGETS;
  }
  if (['support-clear','hammer-return','hammer-lower','tool-release','tool-clear'].includes(machine.phase)) return plan.armKey === 'r3' ? plan.ready : plan.support ?? plan.clear;
  if (['support-approach', 'support-clamp', 'hammer-stage', 'hammer-strike', 'hammer-recover', 'support-release'].includes(machine.phase) && plan.support) return plan.support;
  if (machine.phase === 'return-home') return interpolateJointTargets(plan.returnStart ?? plan.clear, ASSEMBLY1_STEP3_HOME_JOINT_TARGETS, progress(ASSEMBLY1_STEP4_DURATIONS.returnHome));
  if (machine.phase === 'donor-tighten') return plan.hold;
  if (machine.phase === 'prepare') {
    return interpolateJointTargets(plan.hold, plan.prepare, progress(ASSEMBLY1_STEP4_DURATIONS.prepare));
  }
  if (machine.phase === 'engage') {
    if (plan.armKey === 'r2' || plan.armKey === 'r3') return plan.prepare;
    return interpolateJointTargets(plan.prepare, plan.engage, progress(ASSEMBLY1_STEP4_DURATIONS.engage));
  }
  if (
    machine.phase === 'engage-settle'
    || machine.phase === 'receiver-align'
    || machine.phase === 'dual-clamp'
    || machine.phase === 'handover-verification'
    || machine.phase === 'hammer-release'
  ) {
    if (plan.armKey === 'r2') return plan.prepare;
    if (plan.armKey === 'r3' && machine.phase === 'engage-settle') return plan.prepare;
    return plan.engage;
  }
  if (machine.phase === 'donor-clear') {
    if (plan.armKey === 'r2') return plan.prepare;
    if (plan.armKey === 'r3') return plan.engage;
    if (plan.armKey !== 'r1') return plan.engage;
    return interpolateJointTargets(
      plan.engage,
      plan.clear,
      progress(ASSEMBLY1_STEP4_DURATIONS.donorClear),
    );
  }
  if (machine.phase === 'fastener-tighten') {
    if (plan.armKey === 'r2') {
      const descentProgress = Math.min(1, progress(ASSEMBLY1_STEP4_DURATIONS.fastenerTighten) / 0.7);
      return interpolateJointTargets(plan.prepare, plan.engage, descentProgress);
    }
    if (plan.armKey === 'r3') {
      // Keep the receiver motionless after the donor withdraws.  Separating
      // handover from fastener pickup avoids applying a tangential load to the
      // hammer while the other arm descends.
      return plan.engage;
    }
    return plan.armKey === 'r1' ? plan.clear : plan.engage;
  }
  if (
    machine.phase === 'fastener-grip-settle'
    || machine.phase === 'fastener-grasp-verification'
  ) {
    if (plan.armKey === 'r1') return plan.clear;
    if (plan.armKey === 'r3') return plan.engage;
    return plan.engage;
  }
  if (machine.phase === 'lift') {
    if (plan.armKey === 'r1') return plan.clear;
    if (plan.armKey === 'r3') return plan.engage;
    if (plan.armKey === 'r2' && plan.liftPath?.length > 1) {
      return pathTarget(plan.liftPath, progress(ASSEMBLY1_STEP4_DURATIONS.lift));
    }
    return interpolateJointTargets(plan.engage, plan.lift, progress(ASSEMBLY1_STEP4_DURATIONS.lift));
  }
  if (machine.phase === 'transfer') {
    if (plan.armKey === 'r1') return plan.clear;
    if (plan.armKey === 'r3') return plan.engage;
    return interpolateJointTargets(plan.lift, plan.transfer, progress(ASSEMBLY1_STEP4_DURATIONS.transfer));
  }
  if (machine.phase === 'transfer-settle') {
    if (plan.armKey === 'r1') return plan.clear;
    if (plan.armKey === 'r3') return plan.engage;
    return plan.transfer;
  }
  if (machine.phase === 'insert') {
    if (plan.armKey === 'r1') return plan.clear;
    if (plan.armKey === 'r3') return plan.engage;
    return interpolateJointTargets(plan.transfer, plan.insert, progress(ASSEMBLY1_STEP4_DURATIONS.insert));
  }
  if (machine.phase === 'fastener-release') {
    if (plan.armKey === 'r1') return plan.clear;
    if (plan.armKey === 'r3') return plan.engage;
    return plan.insert;
  }
  if (machine.phase === 'clear') {
    if (plan.armKey === 'r1') return plan.clear;
    if (plan.armKey === 'r3') return plan.engage;
    return interpolateJointTargets(plan.insert, plan.clear, progress(ASSEMBLY1_STEP4_DURATIONS.clear));
  }
  if (machine.phase === 'placement-verification') {
    return plan.armKey === 'r3' ? plan.engage : plan.clear;
  }
  if (machine.phase === 'hammer-stage') {
    if (plan.armKey !== 'r3') return plan.clear;
    return interpolateJointTargets(plan.engage, plan.ready, progress(ASSEMBLY1_STEP4_DURATIONS.hammerStage));
  }
  if (machine.phase === 'hammer-strike') {
    if (plan.armKey !== 'r3') return plan.clear;
    return interpolateJointTargets(plan.ready, plan.strike, progress(ASSEMBLY1_STEP4_DURATIONS.hammerStrike));
  }
  if (machine.phase === 'hammer-recover') {
    if (plan.armKey !== 'r3') return plan.clear;
    return interpolateJointTargets(plan.strike, plan.ready, progress(ASSEMBLY1_STEP4_DURATIONS.hammerRecover));
  }
  if (plan.armKey === 'r3') return plan.ready;
  return plan.clear;
}

export function createAssemblyStep4ControlFrame(machine, plans) {
  return {
    arms: plans.map((plan, index) => {
      let gripperTarget = [
        ASSEMBLY1_STEP4_GRIPPERS.frame,
        ASSEMBLY1_STEP4_GRIPPERS.tool,
        ASSEMBLY1_STEP4_GRIPPERS.open,
        ASSEMBLY1_STEP4_GRIPPERS.open,
      ][index];
      if (machine.phase === 'donor-tighten' && index === 1) {
        gripperTarget = interpolateJointTargets(
          [ASSEMBLY1_STEP4_GRIPPERS.donorEntry],
          [ASSEMBLY1_STEP4_GRIPPERS.tool],
          machine.phaseElapsed / ASSEMBLY1_STEP4_DURATIONS.donorTighten,
        )[0];
      } else if (machine.phase === 'dual-clamp') {
        if (index === 3) {
          gripperTarget = interpolateJointTargets(
            [ASSEMBLY1_STEP4_GRIPPERS.open],
            [ASSEMBLY1_STEP4_GRIPPERS.receiverTool],
            machine.phaseElapsed / ASSEMBLY1_STEP4_DURATIONS.dualClamp,
          )[0];
        }
      } else if (machine.phase === 'handover-verification') {
        if (index === 3) gripperTarget = ASSEMBLY1_STEP4_GRIPPERS.receiverTool;
      } else if (machine.phase === 'hammer-release') {
        if (index === 1) {
          gripperTarget = interpolateJointTargets(
            [ASSEMBLY1_STEP4_GRIPPERS.tool],
            [ASSEMBLY1_STEP4_GRIPPERS.open],
            machine.phaseElapsed / ASSEMBLY1_STEP4_DURATIONS.hammerRelease,
          )[0];
        }
        if (index === 3) gripperTarget = ASSEMBLY1_STEP4_GRIPPERS.receiverTool;
      } else if (['donor-clear', 'receiver-retreat', 'fastener-tighten', 'fastener-grip-settle', 'fastener-grasp-verification', 'lift', 'transfer', 'transfer-settle', 'insert', 'fastener-release', 'clear', 'placement-verification', 'support-approach', 'support-clamp', 'hammer-stage', 'hammer-strike', 'hammer-recover', 'support-release', 'hammer-return', 'hammer-lower', 'tool-release', 'tool-clear', 'return-home', 'complete'].includes(machine.phase)) {
        if (index === 1) gripperTarget = ASSEMBLY1_STEP4_GRIPPERS.open;
        if (index === 3) gripperTarget = ASSEMBLY1_STEP4_GRIPPERS.receiverTool;
      }
      if (index < 3 && ['support-clamp', 'hammer-stage', 'hammer-strike', 'hammer-recover'].includes(machine.phase)) {
        gripperTarget = machine.phase === 'support-clamp' && index > 0
          ? interpolateJointTargets([255], [130], machine.phaseElapsed / ASSEMBLY1_STEP4_DURATIONS.supportClamp)[0]
          : 130;
      }
      if (index < 3 && ['support-release', 'support-clear', 'hammer-return','hammer-lower','tool-release','tool-clear','return-home', 'complete'].includes(machine.phase)) {
        gripperTarget = machine.phase === 'support-release'
          ? interpolateJointTargets([130], [255], machine.phaseElapsed / ASSEMBLY1_STEP4_DURATIONS.supportRelease)[0]
          : 255;
      }
      if (index === 3 && ['tool-release','tool-clear','return-home','complete'].includes(machine.phase)) gripperTarget = machine.phase === 'tool-release'
        ? interpolateJointTargets([ASSEMBLY1_STEP4_GRIPPERS.receiverTool],[255],machine.phaseElapsed/ASSEMBLY1_STEP4_DURATIONS.toolRelease)[0] : 255;
      if(index===3 && machine.phase==='support-clear')gripperTarget=ASSEMBLY1_STEP4_GRIPPERS.receiverTool;

      if (index === 2 && machine.phase === 'fastener-tighten') {
        const phaseProgress = machine.phaseElapsed / ASSEMBLY1_STEP4_DURATIONS.fastenerTighten;
        if (phaseProgress >= 0.7) {
          gripperTarget = interpolateJointTargets(
            [ASSEMBLY1_STEP4_GRIPPERS.open],
            [ASSEMBLY1_STEP4_GRIPPERS.fastener],
            (phaseProgress - 0.7) / 0.3,
          )[0];
        }
      } else if (
        index === 2
        && ['fastener-grip-settle', 'fastener-grasp-verification', 'lift', 'transfer', 'transfer-settle', 'insert'].includes(machine.phase)
      ) {
        gripperTarget = ASSEMBLY1_STEP4_GRIPPERS.fastener;
      } else if (index === 2 && machine.phase === 'fastener-release') {
        gripperTarget = interpolateJointTargets(
          [ASSEMBLY1_STEP4_GRIPPERS.fastener],
          [ASSEMBLY1_STEP4_GRIPPERS.open],
          machine.phaseElapsed / ASSEMBLY1_STEP4_DURATIONS.fastenerRelease,
        )[0];
      }
      return {
        armKey: plan.armKey,
        jointTargets: phaseTargets(machine, plan),
        gripperTarget,
      };
    }),
  };
}

export function evaluateAssemblyStep4Stability({
  frameTranslation,
  crossMemberTranslation,
  crossMemberRotationDegrees,
}) {
  if (![frameTranslation, crossMemberTranslation, crossMemberRotationDegrees].every(Number.isFinite)) {
    return { ok: false, code: 'non-finite-runtime' };
  }
  if (frameTranslation > ASSEMBLY1_STEP4_LIMITS.frameTranslation + ASSEMBLY1_STEP4_LIMITS.comparisonEpsilon) {
    return { ok: false, code: 'frame-drift', detail: String(frameTranslation) };
  }
  if (crossMemberTranslation > ASSEMBLY1_STEP4_LIMITS.crossMemberTranslation || crossMemberRotationDegrees > ASSEMBLY1_STEP4_LIMITS.crossMemberRotationDegrees) {
    return {ok:false,code:'cross-member-disturbed',detail:`${crossMemberTranslation.toFixed(4)}m/${crossMemberRotationDegrees.toFixed(1)}deg`};
  }
  return { ok: true };
}

export function evaluateAssemblyStep4HammerHandover({
  leftContact,
  rightContact,
  aperture,
  receiverGraspPointDistance,
  leftContactDistance = null,
  rightContactDistance = null,
}) {
  if (![aperture, receiverGraspPointDistance].every(Number.isFinite)) {
    return { ok: false, code: 'non-finite-runtime', armKey: 'r3' };
  }
  if (!leftContact) return { ok: false, code: 'missing-hammer-left-contact', armKey: 'r3' };
  if (!rightContact) return { ok: false, code: 'missing-hammer-right-contact', armKey: 'r3' };
  if (receiverGraspPointDistance > ASSEMBLY1_STEP4_LIMITS.maximumHammerGraspPointDistance) {
    return {
      ok: false,
      code: 'receiver-off-grasp-zone',
      armKey: 'r3',
      detail: String(receiverGraspPointDistance),
    };
  }
  if (aperture > ASSEMBLY1_STEP4_LIMITS.maximumToolAperture) {
    return {
      ok: false,
      code: 'receiver-not-closed',
      armKey: 'r3',
      detail: String(aperture),
    };
  }
  const contactDistances = [leftContactDistance, rightContactDistance]
    .filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (
    contactDistances.length > 0
    && Math.min(...contactDistances) < -(
      ASSEMBLY1_STEP4_LIMITS.maximumContactPenetration
      + ASSEMBLY1_STEP4_LIMITS.contactComparisonEpsilon
    )
  ) {
    return {
      ok: false,
      code: 'deep-penetration',
      armKey: 'r3',
      detail: String(Math.min(...contactDistances)),
    };
  }
  if (!(aperture > ASSEMBLY1_STEP4_LIMITS.minimumToolAperture)) {
    return { ok: false, code: 'empty-closure', armKey: 'r3' };
  }
  return { ok: true };
}

export function evaluateAssemblyStep4Placement({ fastenerPlanarDistance, fastenerHeight }) {
  if (![fastenerPlanarDistance, fastenerHeight].every(Number.isFinite)) {
    return { ok: false, code: 'non-finite-runtime' };
  }
  if (fastenerPlanarDistance > ASSEMBLY1_STEP4_LIMITS.fastenerPlanarDistance) {
    return { ok: false, code: 'fastener-misalignment', detail: String(fastenerPlanarDistance) };
  }
  if (
    fastenerHeight < ASSEMBLY1_STEP4_LIMITS.fastenerMinimumHeight
    || fastenerHeight > ASSEMBLY1_STEP4_LIMITS.fastenerMaximumHeight
  ) {
    return { ok: false, code: 'fastener-height', detail: String(fastenerHeight) };
  }
  return { ok: true };
}
