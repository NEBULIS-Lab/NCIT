import type {
  UnitreeActionSample,
} from './unitreeActionSequence.js';

export interface UnitreeFreeRootAddress {
  jointId: number;
  qposAddress: number;
  dofAddress: number;
}

export interface UnitreeFreeRootAddresses {
  g1: UnitreeFreeRootAddress;
  go2: UnitreeFreeRootAddress;
}

export interface UnitreeRootState {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  velocity: [number, number, number];
  angularVelocity: [number, number, number];
  speed: number;
  forwardSpeed: number;
  lateralSpeed: number;
  roll: number;
  pitch: number;
  rollRate: number;
  pitchRate: number;
}

export interface UnitreeRootDisplacement {
  x: number;
  y: number;
  z: number;
  planar: number;
}

export interface UnitreeRuntimeDiagnostics {
  programId: 'greeting' | 'locomotion';
  phase: string;
  elapsed: number;
  initial: { g1: UnitreeRootState; go2: UnitreeRootState };
  current: { g1: UnitreeRootState; go2: UnitreeRootState };
  displacement: { g1: UnitreeRootDisplacement; go2: UnitreeRootDisplacement };
  clampCount: number;
  safe: boolean;
  safetyReason: string | null;
}

export function resolveUnitreeFreeRootAddresses(
  model: {
    jnt_qposadr: Int32Array;
    jnt_dofadr: Int32Array;
    jnt_type: Int32Array;
  },
  findJointId: (name: string) => number,
): UnitreeFreeRootAddresses;
export function quaternionToRollPitch(
  quaternion: ArrayLike<number> & { every(callback: (value: number) => boolean): boolean },
): { roll: number; pitch: number };
export function readUnitreeRootState(
  qpos: ArrayLike<number>,
  qvel: ArrayLike<number>,
  address: Pick<UnitreeFreeRootAddress, 'qposAddress' | 'dofAddress'>,
): UnitreeRootState;
export function computeRootDisplacement(
  initial: UnitreeRootState,
  current: UnitreeRootState,
): UnitreeRootDisplacement;
export function validateUnitreeDynamicsState(state: {
  g1: UnitreeRootState | Pick<UnitreeRootState, 'position' | 'roll' | 'pitch'>;
  go2: UnitreeRootState | Pick<UnitreeRootState, 'position' | 'roll' | 'pitch'>;
}): { safe: boolean; reason: string | null };
export function validateLocomotionTargets<T extends UnitreeActionSample>(sample: T): T;
