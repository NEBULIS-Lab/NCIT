import {
  DEFAULT_UNITREE_ACTION_PROGRAM_ID,
  getUnitreeActionProgram,
  sampleUnitreeActionProgram,
} from './unitreeActionSequence.js';

export function createInitialUnitreeActionState(programId = DEFAULT_UNITREE_ACTION_PROGRAM_ID) {
  const program = getUnitreeActionProgram(programId);
  return { programId: program.id, status: 'idle', phase: 'settle', elapsed: 0, error: null };
}

export function startAction(state) {
  if (state.status !== 'idle' && state.status !== 'complete') return state;
  return { ...state, status: 'running', phase: 'settle', elapsed: 0, error: null };
}

export function pauseAction(state) {
  return state.status === 'running' ? { ...state, status: 'paused' } : state;
}

export function resumeAction(state) {
  return state.status === 'paused' ? { ...state, status: 'running' } : state;
}

export function selectActionProgram(state, programId) {
  if (state.status === 'running' || state.status === 'paused') return state;
  return createInitialUnitreeActionState(programId);
}

export function completeAction(state) {
  if (state.status === 'error') return state;
  const program = getUnitreeActionProgram(state.programId);
  return {
    programId: program.id,
    status: 'complete',
    phase: 'complete',
    elapsed: program.duration,
    error: null,
  };
}

export function advanceAction(state, deltaSeconds) {
  if (state.status !== 'running' || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return state;
  const program = getUnitreeActionProgram(state.programId);
  const elapsed = Math.min(program.duration, state.elapsed + deltaSeconds);
  if (elapsed >= program.duration) return completeAction(state);
  return { ...state, phase: sampleUnitreeActionProgram(program.id, elapsed).phase, elapsed };
}

export function failAction(state, error) {
  if (state.status === 'error') return state;
  const message = error instanceof Error ? error.message : String(error);
  return { ...state, status: 'error', error: message };
}

export function resetAction(stateOrProgramId) {
  const programId = typeof stateOrProgramId === 'string'
    ? stateOrProgramId
    : stateOrProgramId?.programId;
  return createInitialUnitreeActionState(programId ?? DEFAULT_UNITREE_ACTION_PROGRAM_ID);
}
