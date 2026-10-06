export function shiftIndices(indices, offset) {
  return indices.map((index) => index + offset);
}

function prefixedNames(prefix, names) {
  return names.map((name) => `${prefix}${name}`);
}

export function createFrankaTargets() {
  return Array.from({ length: 4 }, (_, index) => {
    const prefix = `r${index}_`;
    const actuatorOffset = index * 8;
    return {
      key: `r${index}`,
      label: `Arm ${index + 1}`,
      prefix,
      actuatorOffset,
      gripperActuator: `${prefix}gripper`,
      ik: {
        siteName: `${prefix}tcp`,
        jointNames: prefixedNames(prefix, [
          'joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6', 'joint7',
        ]),
        actuatorIndices: shiftIndices([0, 1, 2, 3, 4, 5, 6], actuatorOffset),
      },
    };
  });
}

function createIndustrialTargets({ jointNames, siteName, gripperActuator, openValue, closedValue }) {
  return Array.from({ length: 4 }, (_, index) => {
    const prefix = `r${index}_`;
    const actuatorOffset = index * 7;
    return {
      key: `r${index}`,
      label: `Arm ${index + 1}`,
      prefix,
      actuatorOffset,
      gripperControl: {
        actuator: `${prefix}${gripperActuator}`,
        openValue,
        closedValue,
      },
      ik: {
        siteName: `${prefix}${siteName}`,
        jointNames: prefixedNames(prefix, jointNames),
        actuatorIndices: shiftIndices([0, 1, 2, 3, 4, 5], actuatorOffset),
      },
    };
  });
}

export function createPiperTargets() {
  return createIndustrialTargets({
    jointNames: ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6'],
    siteName: 'tcp',
    gripperActuator: 'gripper',
    openValue: 0.035,
    closedValue: 0,
  });
}

export function createUR5eTargets() {
  return createIndustrialTargets({
    jointNames: [
      'shoulder_pan_joint', 'shoulder_lift_joint', 'elbow_joint',
      'wrist_1_joint', 'wrist_2_joint', 'wrist_3_joint',
    ],
    siteName: 'gripper_pinch',
    gripperActuator: 'gripper_fingers_actuator',
    openValue: 0,
    closedValue: 255,
  });
}

export function createSO101Targets() {
  return Array.from({ length: 4 }, (_, index) => {
    const prefix = `r${index}_`;
    const actuatorOffset = index * 6;
    return {
      key: `r${index}`,
      label: `Arm ${index + 1}`,
      prefix,
      actuatorOffset,
      ik: {
        siteName: `${prefix}tcp`,
        jointNames: prefixedNames(prefix, [
          'Rotation', 'Pitch', 'Elbow', 'Wrist_Pitch', 'Wrist_Roll',
        ]),
        actuatorIndices: shiftIndices([0, 1, 2, 3, 4], actuatorOffset),
      },
    };
  });
}

export function createSO101HomeLabTargets() {
  const arms = createSO101Targets().map((target) => ({
    ...target,
    actuatorOffset: target.actuatorOffset + 6,
    ik: {
      ...target.ik,
      actuatorIndices: shiftIndices(target.ik.actuatorIndices, 6),
    },
  }));
  return [
    ...arms,
    {
      key: 'g1',
      label: 'G1',
      prefix: 'room_g1_',
      actuatorOffset: 0,
      controlMode: 'planar-mobile',
      mobility: {
        actuatorIndices: [0, 1, 2],
        yawJoint: 'home_lab_g1_yaw',
        initialYawDegrees: 155,
        linearSpeed: 0.42,
        turnSpeed: 0.8,
      },
    },
    {
      key: 'go2Arm',
      label: 'Go2 + Arm',
      prefix: 'room_go2_',
      actuatorOffset: 3,
      controlMode: 'planar-mobile',
      mobility: {
        actuatorIndices: [3, 4, 5],
        yawJoint: 'home_lab_go2_yaw',
        initialYawDegrees: 150,
        linearSpeed: 0.48,
        turnSpeed: 0.9,
      },
    },
  ];
}

export function createXLeRobotTargets() {
  return Array.from({ length: 2 }, (_, index) => ({
    key: `r${index}`,
    label: `Robot ${index + 1}`,
    prefix: `r${index}_`,
    actuatorOffset: index * 16,
  }));
}

export function createUnitreeActionTargets() {
  return [{
    key: 'unitreeAction',
    label: 'G1 + Go2 action',
    prefix: '',
    actuatorOffset: 0,
    controlMode: 'action-sequence',
  }];
}
