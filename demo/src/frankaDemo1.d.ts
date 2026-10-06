export type FrankaDemo1Action = 'step1' | 'step2' | 'step3' | 'step4' | 'complete' | 'error';

export interface FrankaDemo1SequenceState {
  active: boolean;
  sceneReady: boolean;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
}

export function nextFrankaDemo1Action(
  state: FrankaDemo1SequenceState,
): FrankaDemo1Action | null;
export function frankaDemo1DisplayAction(
  state: FrankaDemo1SequenceState,
): FrankaDemo1Action | null;
export function frankaDemo1StatusText(action: FrankaDemo1Action | null): string;
