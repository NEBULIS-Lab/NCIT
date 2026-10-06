import type {
  UnitreeActionPhaseName,
  UnitreeActionSample,
} from './unitreeActionSequence.js';

export interface UnitreeAttitudeFeedback {
  roll: number;
  pitch: number;
  rollRate: number;
  pitchRate: number;
  forwardSpeed?: number;
  lateralSpeed?: number;
}

export interface UnitreeLocomotionFeedback {
  g1?: UnitreeAttitudeFeedback;
  go2?: UnitreeAttitudeFeedback;
}

export interface GaitSample {
  targets: number[];
  cyclePhase: number;
  envelope: number;
  clampCount: number;
  correction: { roll: number; pitch: number };
}

export interface UnitreeLocomotionSample extends UnitreeActionSample {
  phase: UnitreeActionPhaseName;
  diagnostics: {
    cyclePhase: number;
    envelope: number;
    clampCount: number;
  };
}

export const G1_WALK_READY: number[];
export const G1_SQUAT: number[];

export function locomotionEnvelope(progress: number, rampFraction?: number): number;
export function computeBalanceCorrection(
  attitude?: UnitreeAttitudeFeedback,
  gains?: {
    rollKp?: number;
    pitchKp?: number;
    rollKd?: number;
    pitchKd?: number;
    limit?: number;
  },
): { roll: number; pitch: number };
export function sampleG1Squat(progress: number, returningToStand?: boolean): number[];
export function sampleG1Gait(
  cyclePhase: number,
  envelope?: number,
  attitude?: UnitreeAttitudeFeedback,
  balanceEnvelope?: number,
  brakeEnvelope?: number,
): GaitSample;
export function sampleGo2Trot(
  cyclePhase: number,
  envelope?: number,
  attitude?: UnitreeAttitudeFeedback,
  balanceEnvelope?: number,
): GaitSample;
export function sampleUnitreeLocomotionAction(
  elapsedSeconds: number,
  feedback?: UnitreeLocomotionFeedback,
): UnitreeLocomotionSample;
