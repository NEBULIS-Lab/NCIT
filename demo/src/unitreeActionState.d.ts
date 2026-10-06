import type {
  UnitreeActionPhaseName,
  UnitreeActionProgramId,
} from './unitreeActionSequence.js';

export type UnitreeActionStatus = 'idle' | 'running' | 'paused' | 'complete' | 'error';

export interface UnitreeActionState {
  programId: UnitreeActionProgramId;
  status: UnitreeActionStatus;
  phase: UnitreeActionPhaseName;
  elapsed: number;
  error: string | null;
}

export function createInitialUnitreeActionState(
  programId?: UnitreeActionProgramId,
): UnitreeActionState;
export function startAction(state: UnitreeActionState): UnitreeActionState;
export function pauseAction(state: UnitreeActionState): UnitreeActionState;
export function resumeAction(state: UnitreeActionState): UnitreeActionState;
export function selectActionProgram(
  state: UnitreeActionState,
  programId: UnitreeActionProgramId,
): UnitreeActionState;
export function advanceAction(state: UnitreeActionState, deltaSeconds: number): UnitreeActionState;
export function completeAction(state: UnitreeActionState): UnitreeActionState;
export function failAction(state: UnitreeActionState, error: unknown): UnitreeActionState;
export function resetAction(
  stateOrProgramId?: UnitreeActionState | UnitreeActionProgramId,
): UnitreeActionState;
