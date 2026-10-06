import { G1_HOME, GO2_HOME } from './unitreeActionLab.js';

export { G1_HOME, GO2_HOME };

const actuator = (name, min, max) => ({ name, min, max });

export function isControlRangeCompatible(actuatorDefinition, rangeMin, rangeMax) {
  const tolerance = 1e-5;
  return Number.isFinite(rangeMin)
    && Number.isFinite(rangeMax)
    && actuatorDefinition.min >= rangeMin - tolerance
    && actuatorDefinition.max <= rangeMax + tolerance;
}

export const G1_ACTUATORS = [
  actuator('g1_left_hip_pitch_joint', -2.5307, 2.8798),
  actuator('g1_left_hip_roll_joint', -0.5236, 2.9671),
  actuator('g1_left_hip_yaw_joint', -2.7576, 2.7576),
  actuator('g1_left_knee_joint', -0.087267, 2.8798),
  actuator('g1_left_ankle_pitch_joint', -0.87267, 0.5236),
  actuator('g1_left_ankle_roll_joint', -0.2618, 0.2618),
  actuator('g1_right_hip_pitch_joint', -2.5307, 2.8798),
  actuator('g1_right_hip_roll_joint', -2.9671, 0.5236),
  actuator('g1_right_hip_yaw_joint', -2.7576, 2.7576),
  actuator('g1_right_knee_joint', -0.087267, 2.8798),
  actuator('g1_right_ankle_pitch_joint', -0.87267, 0.5236),
  actuator('g1_right_ankle_roll_joint', -0.2618, 0.2618),
  actuator('g1_waist_yaw_joint', -2.618, 2.618),
  actuator('g1_waist_roll_joint', -0.52, 0.52),
  actuator('g1_waist_pitch_joint', -0.52, 0.52),
  actuator('g1_left_shoulder_pitch_joint', -3.0892, 2.6704),
  actuator('g1_left_shoulder_roll_joint', -1.5882, 2.2515),
  actuator('g1_left_shoulder_yaw_joint', -2.618, 2.618),
  actuator('g1_left_elbow_joint', -1.0472, 2.0944),
  actuator('g1_left_wrist_roll_joint', -1.97222, 1.97222),
  actuator('g1_left_wrist_pitch_joint', -1.61443, 1.61443),
  actuator('g1_left_wrist_yaw_joint', -1.61443, 1.61443),
  actuator('g1_right_shoulder_pitch_joint', -3.0892, 2.6704),
  actuator('g1_right_shoulder_roll_joint', -2.2515, 1.5882),
  actuator('g1_right_shoulder_yaw_joint', -2.618, 2.618),
  actuator('g1_right_elbow_joint', -1.0472, 2.0944),
  actuator('g1_right_wrist_roll_joint', -1.97222, 1.97222),
  actuator('g1_right_wrist_pitch_joint', -1.61443, 1.61443),
  actuator('g1_right_wrist_yaw_joint', -1.61443, 1.61443),
];

export const GO2_ACTUATORS = [
  actuator('go2_FL_hip', -0.9472, 0.9472),
  actuator('go2_FL_thigh', -1.4, 2.5),
  actuator('go2_FL_calf', -2.6227, -0.84776),
  actuator('go2_FR_hip', -0.9472, 0.9472),
  actuator('go2_FR_thigh', -1.4, 2.5),
  actuator('go2_FR_calf', -2.6227, -0.84776),
  actuator('go2_RL_hip', -0.9472, 0.9472),
  actuator('go2_RL_thigh', -1.4, 2.5),
  actuator('go2_RL_calf', -2.6227, -0.84776),
  actuator('go2_RR_hip', -0.9472, 0.9472),
  actuator('go2_RR_thigh', -1.4, 2.5),
  actuator('go2_RR_calf', -2.6227, -0.84776),
  actuator('go2_joint1', -3.1416, 2.0944),
  actuator('go2_joint2', -2.9671, 0.17453),
  actuator('go2_joint3', -0.087266, 3.1416),
  actuator('go2_joint4', -3.0107, 3.0107),
  actuator('go2_joint5', -1.7628, 1.7628),
  actuator('go2_joint6', -3.0107, 3.0107),
];

export const GO2_STAND = [
  0.00571868, 0.608813, -1.21763,
  -0.00571868, 0.608813, -1.21763,
  0.00571868, 0.608813, -1.21763,
  -0.00571868, 0.608813, -1.21763,
];

export const GO2_LOWER = [
  0.0473455, 1.22187, -2.44375,
  -0.0473455, 1.22187, -2.44375,
  0.0473455, 1.22187, -2.44375,
  -0.0473455, 1.22187, -2.44375,
];

const G1_GREET = [
  ...G1_HOME.slice(0, 22),
  0, -1.45, 0, -0.85, 0, 0.22, 0,
];
const GO2_SCAN_ARM = [0.52, -0.72, 1.12, 1.15, -0.38, -1.18];

export const UNITREE_ACTION_PHASES = [
  { name: 'settle', duration: 1 },
  { name: 'rise-greet', duration: 1.5 },
  { name: 'scan-wave', duration: 3 },
  { name: 'lower', duration: 1.5 },
  { name: 'recover', duration: 1.5 },
  { name: 'final-hold', duration: 1.5 },
];

export const UNITREE_ACTION_DURATION = UNITREE_ACTION_PHASES.reduce(
  (sum, phase) => sum + phase.duration,
  0,
);

export const DEFAULT_UNITREE_ACTION_PROGRAM_ID = 'greeting';

export const UNITREE_LOCOMOTION_PHASES = [
  { name: 'settle', duration: 1 },
  { name: 'g1-squat', duration: 2 },
  { name: 'g1-stand', duration: 2 },
  { name: 'g1-walk', duration: 6 },
  { name: 'g1-stabilize', duration: 2 },
  { name: 'go2-walk', duration: 6 },
  { name: 'go2-stabilize', duration: 2 },
  { name: 'final-greeting', duration: 3 },
  { name: 'final-hold', duration: 1 },
];

export const UNITREE_LOCOMOTION_DURATION = UNITREE_LOCOMOTION_PHASES.reduce(
  (sum, phase) => sum + phase.duration,
  0,
);

export const UNITREE_ACTION_PROGRAMS = Object.freeze({
  greeting: Object.freeze({
    id: 'greeting',
    label: '问候与扫描',
    duration: UNITREE_ACTION_DURATION,
    phases: UNITREE_ACTION_PHASES,
  }),
  locomotion: Object.freeze({
    id: 'locomotion',
    label: '完整运动套件',
    duration: UNITREE_LOCOMOTION_DURATION,
    phases: UNITREE_LOCOMOTION_PHASES,
  }),
});

export function getUnitreeActionProgram(programId = DEFAULT_UNITREE_ACTION_PROGRAM_ID) {
  const program = UNITREE_ACTION_PROGRAMS[programId];
  if (!program) throw new Error(`Unknown Unitree action program: ${programId}`);
  return program;
}

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const mix = (from, to, amount) => from.map(
  (value, index) => value + (to[index] - value) * amount,
);

function phaseAt(time, phases = UNITREE_ACTION_PHASES, duration = UNITREE_ACTION_DURATION) {
  let start = 0;
  for (const phase of phases) {
    const end = start + phase.duration;
    if (time < end) return { ...phase, start, progress: (time - start) / phase.duration };
    start = end;
  }
  return { name: 'complete', duration: 0, start: duration, progress: 1 };
}

export function sampleUnitreeAction(elapsedSeconds) {
  const time = Math.min(
    UNITREE_ACTION_DURATION,
    Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0),
  );
  const phase = phaseAt(time);
  const eased = smoothstep(phase.progress);
  let g1Targets = [...G1_HOME];
  let go2Targets = [...GO2_HOME];

  if (phase.name === 'rise-greet') {
    g1Targets = mix(G1_HOME, G1_GREET, eased);
    go2Targets = [
      ...mix(GO2_HOME.slice(0, 12), GO2_STAND, eased),
      ...GO2_HOME.slice(12),
    ];
  } else if (phase.name === 'scan-wave') {
    const envelope = Math.sin(Math.PI * clamp01(phase.progress));
    const wristWave = 0.62 * envelope * Math.cos(4 * Math.PI * phase.progress);
    const scanSweep = 0.18 * envelope * Math.sin(2 * Math.PI * phase.progress);
    g1Targets = [...G1_GREET];
    g1Targets[26] += wristWave;
    const armTargets = GO2_HOME.slice(12).map(
      (value, index) => value + (GO2_SCAN_ARM[index] - value) * envelope,
    );
    armTargets[0] += scanSweep;
    go2Targets = [...GO2_STAND, ...armTargets];
  } else if (phase.name === 'lower') {
    g1Targets = mix(G1_GREET, G1_HOME, eased);
    go2Targets = [
      ...mix(GO2_STAND, GO2_LOWER, eased),
      ...GO2_HOME.slice(12),
    ];
  } else if (phase.name === 'recover') {
    go2Targets = [
      ...mix(GO2_LOWER, GO2_HOME.slice(0, 12), eased),
      ...GO2_HOME.slice(12),
    ];
  }

  return {
    phase: phase.name,
    elapsed: time,
    g1Targets,
    go2Targets,
  };
}

export function sampleUnitreeActionProgram(programId, elapsedSeconds) {
  const program = getUnitreeActionProgram(programId);
  if (program.id === 'greeting') return sampleUnitreeAction(elapsedSeconds);

  const time = Math.min(
    program.duration,
    Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0),
  );
  const phase = phaseAt(time, program.phases, program.duration);
  return {
    phase: phase.name,
    elapsed: time,
    g1Targets: [...G1_HOME],
    go2Targets: [...GO2_HOME],
  };
}

export function applyUnitreeActionTargets(ctrl, actuatorIds, sample) {
  const groups = [
    ['g1', actuatorIds?.g1, sample?.g1Targets, G1_ACTUATORS.length],
    ['go2', actuatorIds?.go2, sample?.go2Targets, GO2_ACTUATORS.length],
  ];
  const writes = [];
  const seen = new Set();

  for (const [name, ids, targets, expectedLength] of groups) {
    if (!ids || !targets || ids.length !== expectedLength || targets.length !== expectedLength) {
      throw new Error(`${name} actuator mapping must contain ${expectedLength} entries`);
    }
    for (let index = 0; index < expectedLength; index += 1) {
      const id = ids[index];
      const target = targets[index];
      if (!Number.isInteger(id) || id < 0 || id >= ctrl.length) {
        throw new Error(`${name} actuator id ${id} is out of range`);
      }
      if (seen.has(id)) throw new Error(`duplicate actuator id ${id}`);
      if (!Number.isFinite(target)) throw new Error(`${name} target ${index} must be finite`);
      seen.add(id);
      writes.push([id, target]);
    }
  }

  for (const [id, target] of writes) ctrl[id] = target;
}
