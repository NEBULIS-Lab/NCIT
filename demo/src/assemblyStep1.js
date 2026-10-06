export const ASSEMBLY1_STEP1_PHASE_DURATION = 1.5;
export const ASSEMBLY1_STEP1_SETTLE_DURATION = 3;
export const ASSEMBLY1_GRIPPER_OPEN = 255;
export const ASSEMBLY1_STEP1_IK_VERSION = 'short-path-symmetric-grasp-v11';

export function topDownTcpQuaternion(closingAxisYawDegrees) {
  const halfTurn = (closingAxisYawDegrees + 90) * Math.PI / 360;
  return [Math.cos(halfTurn), Math.sin(halfTurn), 0, 0]
    .map((value) => (Math.abs(value) < 1e-12 ? 0 : value));
}

const roles = [
  {
    role: 'south frame rail',
    highWaypoint: [0.18, -0.23, 0.50],
    finalWaypoint: [0.18, -0.23, 0.33],
    // The parallel gripper is 180-degree symmetric.  This equivalent yaw
    // keeps the same rail closing axis while avoiding the opposite IK branch.
    closingAxisYawDegrees: -90,
    highJointTargets: [1.930559, 0.625991, -0.93255, -1.241597, 0.49131, 1.641015, 1.849847],
    finalJointTargets: [1.96697, 0.736078, -0.863517, -1.532364, 0.59264, 1.988842, 1.770368],
  },
  {
    role: 'horizontal hammer handle',
    highWaypoint: [0.61, -0.421, 0.48],
    finalWaypoint: [0.61, -0.421, 0.28],
    closingAxisYawDegrees: 90,
    highJointTargets: [1.375447, -0.320432, 1.060973, -2.099078, 0.298101, 1.925046, 1.52242],
    finalJointTargets: [1.409512, 0.27973, 1.120638, -2.339038, -0.387314, 2.426404, 2.027343],
  },
  {
    role: 'cross member north balance point',
    highWaypoint: [-0.49, 0.56, 0.48],
    finalWaypoint: [-0.49, 0.56, 0.32],
    closingAxisYawDegrees: 0,
    highJointTargets: [1.408659, -0.716703, -0.347729, -2.561273, -0.236465, 1.867725, -2.714777],
    finalJointTargets: [1.405982, -0.491764, -0.460373, -2.836589, -0.305042, 2.365578, -2.711917],
  },
  {
    role: 'cross member south balance point',
    highWaypoint: [-0.49, 0.32, 0.48],
    finalWaypoint: [-0.49, 0.32, 0.32],
    closingAxisYawDegrees: 0,
    highJointTargets: [2.716026, -0.36425, -0.309448, -2.310332, -0.118177, 1.961558, 0.114814],
    finalJointTargets: [2.730191, -0.144788, -0.361464, -2.543284, -0.078026, 2.406184, 0.074369],
  },
];

export const ASSEMBLY1_STEP1_ARMS = roles.map((role, index) => {
  const prefix = `r${index}_`;
  const actuatorOffset = index * 8;
  return {
    key: `r${index}`,
    label: `Arm ${index + 1}`,
    ...role,
    tcpQuaternion: topDownTcpQuaternion(role.closingAxisYawDegrees),
    siteName: `${prefix}tcp`,
    jointNames: Array.from({ length: 7 }, (_, joint) => `${prefix}joint${joint + 1}`),
    actuatorIndices: Array.from({ length: 7 }, (_, joint) => actuatorOffset + joint),
    gripperActuatorIndex: actuatorOffset + 7,
  };
});

export function smoothstep01(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

export function interpolateJointTargets(from, to, progress) {
  const eased = smoothstep01(progress);
  return from.map((value, index) => value + (to[index] - value) * eased);
}

export function holdAssemblyJointState(controls, positions, velocities, arms) {
  for (const arm of arms) {
    for (let joint = 0; joint < arm.positions.length; joint += 1) {
      controls[arm.actuatorIndices[joint]] = arm.positions[joint];
      positions[arm.qposAddresses[joint]] = arm.positions[joint];
      velocities[arm.dofAddresses[joint]] = 0;
    }
  }
}

export function selectAssemblyStep1Phase(elapsed) {
  const motionDuration = ASSEMBLY1_STEP1_PHASE_DURATION * 2;
  if (elapsed >= motionDuration + ASSEMBLY1_STEP1_SETTLE_DURATION) {
    return { phase: 'complete', progress: 1 };
  }
  if (elapsed >= motionDuration) {
    return {
      phase: 'settling',
      progress: (elapsed - motionDuration) / ASSEMBLY1_STEP1_SETTLE_DURATION,
    };
  }
  if (elapsed >= ASSEMBLY1_STEP1_PHASE_DURATION) {
    return {
      phase: 'final',
      progress: (elapsed - ASSEMBLY1_STEP1_PHASE_DURATION) / ASSEMBLY1_STEP1_PHASE_DURATION,
    };
  }
  return {
    phase: 'high',
    progress: Math.max(0, elapsed) / ASSEMBLY1_STEP1_PHASE_DURATION,
  };
}

export function isCompleteAssemblyStep1Plan(plans) {
  const completeJoints = (values) => (
    Array.isArray(values)
    && values.length === 7
    && values.every(Number.isFinite)
  );
  return (
    Array.isArray(plans)
    && plans.length === ASSEMBLY1_STEP1_ARMS.length
    && plans.every((plan) => (
      plan
      && completeJoints(plan.start)
      && completeJoints(plan.high)
      && completeJoints(plan.final)
    ))
  );
}
