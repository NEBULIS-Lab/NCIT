export interface NamedActuator {
  name: string;
  min: number;
  max: number;
}

export type UnitreeActionPhaseName =
  | 'settle'
  | 'rise-greet'
  | 'scan-wave'
  | 'lower'
  | 'recover'
  | 'g1-squat'
  | 'g1-stand'
  | 'g1-walk'
  | 'g1-stabilize'
  | 'go2-walk'
  | 'go2-stabilize'
  | 'final-greeting'
  | 'final-hold'
  | 'complete';

export type UnitreeActionProgramId = 'greeting' | 'locomotion';

export interface UnitreeActionProgram {
  id: UnitreeActionProgramId;
  label: string;
  duration: number;
  phases: Array<{
    name: Exclude<UnitreeActionPhaseName, 'complete'>;
    duration: number;
  }>;
}

export interface UnitreeActionSample {
  phase: UnitreeActionPhaseName;
  elapsed: number;
  g1Targets: number[];
  go2Targets: number[];
}

export interface UnitreeActuatorIds {
  g1: number[];
  go2: number[];
}

export const G1_ACTUATORS: NamedActuator[];
export const GO2_ACTUATORS: NamedActuator[];
export const G1_HOME: number[];
export const GO2_HOME: number[];
export const GO2_STAND: number[];
export const GO2_LOWER: number[];
export const UNITREE_ACTION_PHASES: Array<{
  name: Exclude<UnitreeActionPhaseName, 'complete'>;
  duration: number;
}>;
export const UNITREE_ACTION_DURATION: number;
export const DEFAULT_UNITREE_ACTION_PROGRAM_ID: UnitreeActionProgramId;
export const UNITREE_LOCOMOTION_PHASES: UnitreeActionProgram['phases'];
export const UNITREE_LOCOMOTION_DURATION: number;
export const UNITREE_ACTION_PROGRAMS: Readonly<Record<UnitreeActionProgramId, UnitreeActionProgram>>;

export function getUnitreeActionProgram(programId?: UnitreeActionProgramId): UnitreeActionProgram;

export function isControlRangeCompatible(
  actuator: NamedActuator,
  rangeMin: number,
  rangeMax: number,
): boolean;

export function sampleUnitreeAction(elapsedSeconds: number): UnitreeActionSample;
export function sampleUnitreeActionProgram(
  programId: UnitreeActionProgramId,
  elapsedSeconds: number,
): UnitreeActionSample;
export function applyUnitreeActionTargets(
  ctrl: Float64Array | number[],
  actuatorIds: UnitreeActuatorIds,
  sample: UnitreeActionSample,
): void;
