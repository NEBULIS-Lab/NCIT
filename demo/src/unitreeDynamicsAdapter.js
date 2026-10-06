import {
  G1_ACTUATORS,
  GO2_ACTUATORS,
} from './unitreeActionSequence.js';

const DEG_TO_RAD = Math.PI / 180;

export function resolveUnitreeFreeRootAddresses(model, findJointId) {
  const resolve = (name) => {
    const jointId = findJointId(name);
    if (!Number.isInteger(jointId) || jointId < 0) {
      throw new Error(`Could not resolve Unitree free joint ${name}`);
    }
    if (model.jnt_type[jointId] !== 0) {
      throw new Error(`Unitree root ${name} must be a MuJoCo free joint`);
    }
    return {
      jointId,
      qposAddress: model.jnt_qposadr[jointId],
      dofAddress: model.jnt_dofadr[jointId],
    };
  };
  return {
    g1: resolve('g1_floating_base_joint'),
    go2: resolve('go2_floating_base_joint'),
  };
}

export function quaternionToRollPitch(quaternion) {
  if (!quaternion || quaternion.length < 4 || !quaternion.every(Number.isFinite)) {
    return { roll: Number.NaN, pitch: Number.NaN };
  }
  let [w, x, y, z] = quaternion;
  const norm = Math.hypot(w, x, y, z);
  if (!Number.isFinite(norm) || norm <= 1e-12) {
    return { roll: Number.NaN, pitch: Number.NaN };
  }
  w /= norm;
  x /= norm;
  y /= norm;
  z /= norm;
  const sinPitch = Math.max(-1, Math.min(1, 2 * (w * y - z * x)));
  return {
    roll: Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
    pitch: Math.asin(sinPitch),
  };
}

function quaternionToYaw(quaternion) {
  let [w, x, y, z] = quaternion;
  const norm = Math.hypot(w, x, y, z);
  if (!Number.isFinite(norm) || norm <= 1e-12) return Number.NaN;
  w /= norm;
  x /= norm;
  y /= norm;
  z /= norm;
  return Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
}

export function readUnitreeRootState(qpos, qvel, address) {
  const q = address.qposAddress;
  const v = address.dofAddress;
  const position = [qpos[q], qpos[q + 1], qpos[q + 2]];
  const quaternion = [qpos[q + 3], qpos[q + 4], qpos[q + 5], qpos[q + 6]];
  const velocity = [qvel[v], qvel[v + 1], qvel[v + 2]];
  const angularVelocity = [qvel[v + 3], qvel[v + 4], qvel[v + 5]];
  const { roll, pitch } = quaternionToRollPitch(quaternion);
  const yaw = quaternionToYaw(quaternion);
  return {
    position,
    quaternion,
    velocity,
    angularVelocity,
    speed: Math.hypot(velocity[0], velocity[1]),
    forwardSpeed: Math.cos(yaw) * velocity[0] + Math.sin(yaw) * velocity[1],
    lateralSpeed: -Math.sin(yaw) * velocity[0] + Math.cos(yaw) * velocity[1],
    roll,
    pitch,
    rollRate: angularVelocity[0],
    pitchRate: angularVelocity[1],
  };
}

export function computeRootDisplacement(initial, current) {
  const x = current.position[0] - initial.position[0];
  const y = current.position[1] - initial.position[1];
  const z = current.position[2] - initial.position[2];
  return { x, y, z, planar: Math.hypot(x, y) };
}

function rootValues(root) {
  return [
    ...(root?.position ?? []),
    ...(root?.quaternion ?? []),
    ...(root?.velocity ?? []),
    ...(root?.angularVelocity ?? []),
    root?.roll,
    root?.pitch,
    root?.rollRate,
    root?.pitchRate,
    root?.forwardSpeed,
    root?.lateralSpeed,
  ].filter((value) => value !== undefined);
}

export function validateUnitreeDynamicsState({ g1, go2 }) {
  const values = [...rootValues(g1), ...rootValues(go2)];
  if (values.length === 0 || !values.every(Number.isFinite)) {
    return { safe: false, reason: 'Unitree dynamics state contains a non-finite value' };
  }
  if (g1.position[2] < 0.5) {
    return { safe: false, reason: `G1 pelvis height ${g1.position[2].toFixed(3)} m is below 0.50 m` };
  }
  if (Math.abs(g1.roll) > 35 * DEG_TO_RAD || Math.abs(g1.pitch) > 35 * DEG_TO_RAD) {
    return { safe: false, reason: 'G1 pelvis tilt exceeds 35 degrees' };
  }
  if (go2.position[2] < 0.16) {
    return { safe: false, reason: `Go2 base height ${go2.position[2].toFixed(3)} m is below 0.16 m` };
  }
  if (Math.abs(go2.roll) > 45 * DEG_TO_RAD || Math.abs(go2.pitch) > 45 * DEG_TO_RAD) {
    return { safe: false, reason: 'Go2 base tilt exceeds 45 degrees' };
  }
  return { safe: true, reason: null };
}

export function validateLocomotionTargets(sample) {
  const groups = [
    ['G1', sample?.g1Targets, G1_ACTUATORS],
    ['Go2', sample?.go2Targets, GO2_ACTUATORS],
  ];
  for (const [name, targets, actuators] of groups) {
    if (!targets || targets.length !== actuators.length) {
      throw new Error(`Locomotion sample must contain ${actuators.length} ${name} targets`);
    }
    targets.forEach((target, index) => {
      if (!Number.isFinite(target)) {
        throw new Error(`${name} target ${index} must be finite`);
      }
      const actuator = actuators[index];
      if (target < actuator.min || target > actuator.max) {
        throw new Error(`${name} target ${index} is outside its control range`);
      }
    });
  }
  return sample;
}
