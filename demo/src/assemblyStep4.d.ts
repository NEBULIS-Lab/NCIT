export type AssemblyStep4Phase =
  | 'idle' | 'planning' | 'donor-tighten' | 'prepare' | 'engage' | 'engage-settle' | 'receiver-align' | 'dual-clamp'
  | 'handover-verification' | 'hammer-release' | 'donor-clear' | 'receiver-retreat'
  | 'fastener-tighten' | 'fastener-grip-settle' | 'fastener-grasp-verification'
  | 'lift' | 'transfer' | 'transfer-settle' | 'insert'
  | 'fastener-release' | 'clear' | 'placement-verification'
  | 'hammer-stage' | 'hammer-strike' | 'hammer-recover'
  | 'support-approach' | 'support-clamp' | 'support-release' | 'support-clear' | 'return-home'
  | 'hammer-return' | 'hammer-lower' | 'tool-release' | 'tool-clear'
  | 'complete' | 'error';

export interface AssemblyStep4Failure {
  code: string;
  armKey?: string;
  detail?: string;
}

export type AssemblyStep4Verdict = { ok: true } | ({ ok: false } & AssemblyStep4Failure);

export interface AssemblyStep4Machine {
  phase: Exclude<AssemblyStep4Phase, 'idle' | 'planning'>;
  phaseElapsed: number;
  continuousValidSeconds: number;
  lastInvalidVerdict?: AssemblyStep4Verdict | null;
  failure: AssemblyStep4Failure | null;
}

export interface AssemblyStep4State {
  phase: AssemblyStep4Phase;
  failure: AssemblyStep4Failure | null;
}

export interface AssemblyStep4ArmPlan {
  armKey: string;
  hold: readonly number[];
  prepare: readonly number[];
  engage: readonly number[];
  lift: readonly number[];
  liftPath?: readonly (readonly number[])[];
  transfer: readonly number[];
  insert: readonly number[];
  clear: readonly number[];
  ready: readonly number[];
  strike: readonly number[];
  phasePaths?: Partial<Record<AssemblyStep4Phase, readonly (readonly number[])[]>>;
  support?: readonly number[];
  returnStart?: readonly number[];
  wait?: readonly number[];
  hammerYaw?: number;
}

export interface AssemblyStep4RuntimeDiagnostics {
  phase: AssemblyStep4Phase;
  phaseElapsed: number;
  continuousValidSeconds: number;
  failure: AssemblyStep4Failure | null;
  simulationTime: number;
  frameTranslation: number;
  crossMemberTranslation: number;
  crossMemberRotationDegrees: number;
  fastenerPosition: [number, number, number];
  fastenerPlanarDistance: number;
  fastenerHeight: number;
  fastenerAperture: number;
  fastenerLeftContact: boolean;
  fastenerRightContact: boolean;
  fastenerLeftContactDistance: number | null;
  fastenerRightContactDistance: number | null;
  hammerAperture: number;
  hammerLeftContact: boolean;
  hammerRightContact: boolean;
  hammerLeftContactDistance: number | null;
  hammerRightContactDistance: number | null;
  hammerReceiverGraspPointDistance: number;
  insertionDepth: number;
  insertionTiltDegrees: number;
  workpiecePenetration: number;
  hammerStrikeContact: boolean;
  strikeObserved: boolean;
  strikeSupportContacts: boolean[][] | null;
  robotCollisions: string[];
  hammerCollisions: string[];
  supportContacts: boolean[][];
}

export const ASSEMBLY1_STEP4_DURATIONS: Readonly<Record<string, number>>;
export const ASSEMBLY1_STEP4_LIMITS: Readonly<Record<string, number>>;
export const ASSEMBLY1_STEP4_GRIPPERS: Readonly<Record<string, number>>;
export const ASSEMBLY1_STEP4_HANDOVER_TCP_QUATERNIONS: Readonly<{
  r1: readonly [number, number, number, number];
  r3: readonly [number, number, number, number];
}>;
export const ASSEMBLY1_STEP4_WAYPOINTS: Readonly<Record<string, Readonly<Record<string, readonly number[]>>>>;
export const ASSEMBLY1_STEP4_ARMS: ReadonlyArray<Readonly<{
  key: string;
  armIndex: number;
  role: string;
  closingAxisYawDegrees?: number;
  jointTargets: Readonly<Record<string, readonly number[]>>;
  liftPathJointTargets?: readonly (readonly number[])[];
}>>;

export function createAssemblyStep4Machine(): AssemblyStep4Machine;
export function advanceAssemblyStep4Machine(
  machine: AssemblyStep4Machine,
  deltaSeconds: number,
  evidence: {
    all?: AssemblyStep4Verdict;
    fastenerGrasp?: AssemblyStep4Verdict;
    fastenerCurrentGrasp?: AssemblyStep4Verdict;
    hammerGrasp?: AssemblyStep4Verdict;
    placement?: AssemblyStep4Verdict;
  },
): AssemblyStep4Machine;
export function createAssemblyStep4ControlFrame(
  machine: AssemblyStep4Machine,
  plans: AssemblyStep4ArmPlan[],
): { arms: Array<{ armKey: string; jointTargets: readonly number[]; gripperTarget: number }> };
export function evaluateAssemblyStep4Stability(input: {
  frameTranslation: number;
  crossMemberTranslation: number;
  crossMemberRotationDegrees: number;
}): AssemblyStep4Verdict;
export function evaluateAssemblyStep4Placement(input: {
  fastenerPlanarDistance: number;
  fastenerHeight: number;
}): AssemblyStep4Verdict;
export function evaluateAssemblyStep4HammerHandover(input: {
  leftContact: boolean;
  rightContact: boolean;
  aperture: number;
  receiverGraspPointDistance: number;
  leftContactDistance?: number | null;
  rightContactDistance?: number | null;
}): AssemblyStep4Verdict;
