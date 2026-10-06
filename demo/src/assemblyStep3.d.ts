export type AssemblyStep3Phase =
  | 'idle'
  | 'planning'
  | 'grasp-check'
  | 'lift'
  | 'lift-settle'
  | 'transfer-a'
  | 'transfer-b'
  | 'hover-settle'
  | 'aligned-descent'
  | 'alignment-verification'
  | 'aligned-hold'
  | 'reseat-lift'
  | 'reseat-descent'
  | 'release'
  | 'release-settle'
  | 'retreat'
  | 'placed-verification'
  | 'complete'
  | 'error';

export type AssemblyStep3FailureCode =
  | 'missing-left-contact'
  | 'missing-right-contact'
  | 'forbidden-contact'
  | 'deep-penetration'
  | 'empty-closure'
  | 'frame-drift'
  | 'cross-member-rotation'
  | 'hole-misalignment'
  | 'hole-height'
  | 'verification-timeout'
  | 'invalid-precondition'
  | 'missing-resource'
  | 'joint-limit'
  | 'non-finite-runtime';

export interface AssemblyStep3Failure {
  code: AssemblyStep3FailureCode;
  armKey?: string;
  detail?: string;
}

export type AssemblyStep3Verdict = { ok: true } | ({ ok: false } & AssemblyStep3Failure);

export interface AssemblyStep3Evidence {
  all?: AssemblyStep3Verdict;
  alignment?: AssemblyStep3Verdict;
}

export interface AssemblyStep3Machine {
  phase: Exclude<AssemblyStep3Phase, 'idle' | 'planning'>;
  phaseElapsed: number;
  continuousValidSeconds: number;
  reseatAttempts: number;
  failure: AssemblyStep3Failure | null;
}

export interface AssemblyStep3ArmPlan {
  armKey: string;
  hold: readonly number[];
  lift: readonly number[];
  transferA: readonly number[];
  transferMid: readonly number[];
  hover: readonly number[];
  descentMid: readonly number[];
  aligned: readonly number[];
  home: readonly number[];
  hammerLift: readonly number[];
  hammerHandover: readonly number[];
  hammerPrelift: readonly number[];
  hammerLiftPath?: readonly (readonly number[])[];
  hammerHandoverPath?: readonly (readonly number[])[];
  transportLiftPath?: readonly (readonly number[])[];
  transportAPath?: readonly (readonly number[])[];
  transportBPath?: readonly (readonly number[])[];
  transportDescentPath?: readonly (readonly number[])[];
}

export interface AssemblyStep3State {
  phase: AssemblyStep3Phase;
  failure: AssemblyStep3Failure | null;
}

export interface AssemblyStep3ArmDiagnostics {
  armKey: string;
  targetBody: string;
  leftContactBodies: string[];
  rightContactBodies: string[];
  aperture: number;
  leftTargetContactDistance: number | null;
  rightTargetContactDistance: number | null;
  gripperControl: number;
  verdict: AssemblyStep3Verdict;
}

export interface AssemblyStep3RuntimeDiagnostics {
  phase: AssemblyStep3Phase;
  phaseElapsed: number;
  continuousValidSeconds: number;
  failure: AssemblyStep3Failure | null;
  simulationTime: number;
  crossMemberPosition: [number, number, number];
  crossMemberQuaternion: [number, number, number, number];
  frameTranslation: number;
  crossMemberRotationDegrees: number;
  holeDistances: number[];
  holePlanarDistances: number[];
  holeVerticalOffsets: number[];
  arms: AssemblyStep3ArmDiagnostics[];
}

export const ASSEMBLY1_STEP3_DURATIONS: Readonly<{
  graspCheckWindow: 0.25;
  verificationTimeout: 4;
  lift: 3;
  liftContactGrace: 1.2;
  transferA: 6.5;
  transferB: 6.5;
  alignedDescent: 3;
  alignedHold: 1;
  reseatLift: 1.2;
  reseatDescent: 1.5;
  release: 0.8;
  releaseSettle: 0.5;
  retreat: 3;
  placedHold: 1;
}>;

export const ASSEMBLY1_STEP3_GRIPPER_CLAMPS: readonly [130, 130, 135, 130];
export const ASSEMBLY1_STEP3_START_GRIPPER_CLAMPS: readonly [130, 130, 135, 130];
export const ASSEMBLY1_STEP3_HOME_JOINT_TARGETS: readonly number[];
export const ASSEMBLY1_STEP3_HAMMER_WAYPOINTS: Readonly<{
  start: readonly [number, number, number];
  prelift: readonly [number, number, number];
  lift: readonly [number, number, number];
  liftPath: readonly (readonly [number, number, number])[];
  handover: readonly [number, number, number];
  handoverPath: readonly (readonly [number, number, number])[];
}>;
export const ASSEMBLY1_STEP3_HAMMER_ARM: Readonly<{
  key: 'r1';
  armIndex: 1;
  closingAxisYawDegrees: 90;
  preliftJointTargets: readonly number[];
  liftJointTargets: readonly number[];
  handoverJointTargets: readonly number[];
  liftPathJointTargets: readonly (readonly number[])[];
}>;

export const ASSEMBLY1_STEP3_LIMITS: Readonly<{
  minimumAperture: 0.035;
  hammerMinimumAperture: 0.035;
  crossMemberMinimumAperture: 0.035;
  maximumContactPenetration: 0.002;
  hammerMaximumContactPenetration: 0.0025;
  frameMaximumContactPenetration: 0.0025;
  contactComparisonEpsilon: 0.00015;
  frameTranslation: 0.02;
  holePlanarDistance: 0.04;
  holeVerticalOffset: 0.025;
  seatedVerticalOffset: 0.02;
  comparisonEpsilon: 0.001;
}>;

export const ASSEMBLY1_STEP3_WAYPOINTS: Readonly<Record<
  'start' | 'lift' | 'transferA' | 'transferMid' | 'hover' | 'descentMid' | 'aligned',
  readonly [readonly [number, number, number], readonly [number, number, number]]
>>;

export const ASSEMBLY1_STEP3_TRANSPORT_ARMS: ReadonlyArray<Readonly<{
  key: 'r2' | 'r3';
  armIndex: 2 | 3;
  closingAxisYawDegrees: number;
  liftJointTargets: readonly number[];
  transferAJointTargets: readonly number[];
  transferMidJointTargets: readonly number[];
  hoverJointTargets: readonly number[];
  descentMidJointTargets: readonly number[];
  alignedJointTargets: readonly number[];
  transportLiftPathJointTargets: readonly (readonly number[])[];
  transportAPathJointTargets: readonly (readonly number[])[];
  transportBPathJointTargets: readonly (readonly number[])[];
  transportDescentPathJointTargets: readonly (readonly number[])[];
}>>;

export function selectAssemblyStep3HoldTarget(
  armIndex: number,
  measuredJointTargets: readonly number[],
): number[];

export function evaluateAssemblyStep3Transport(input: {
  targetBody: string;
  leftContactBodies: string[];
  rightContactBodies: string[];
  forbiddenBodies: string[];
  aperture: number;
  leftTargetContactDistance?: number | null;
  rightTargetContactDistance?: number | null;
  requireBilateralContact?: boolean;
  minimumAperture?: number;
  maximumContactPenetration?: number;
  contactComparisonEpsilon?: number;
}): AssemblyStep3Verdict;

export function evaluateAssemblyStep3Alignment(input: {
  holePlanarDistances: number[];
  holeVerticalOffsets: number[];
  frameTranslation: number;
  crossMemberRotationDegrees: number;
  planarTolerance?: number;
  verticalTolerance?: number;
}): AssemblyStep3Verdict;

export function createAssemblyStep3Machine(): AssemblyStep3Machine;

export function advanceAssemblyStep3Machine(
  machine: AssemblyStep3Machine,
  deltaSeconds: number,
  evidence: AssemblyStep3Evidence,
): AssemblyStep3Machine;

export function createAssemblyStep3ControlFrame(
  machine: AssemblyStep3Machine,
  plans: AssemblyStep3ArmPlan[],
): {
  arms: Array<{
    armKey: string;
    jointTargets: readonly number[];
    gripperTarget: number;
  }>;
};

export function holdAssemblyStep3Controls(
  controls: Float64Array,
  positions: Float64Array,
  arms: Array<{
    actuatorIndices: readonly number[];
    qposAddresses: readonly number[];
    gripperActuatorIndex: number;
  }>,
): void;
