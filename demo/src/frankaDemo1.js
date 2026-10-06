export function nextFrankaDemo1Action({
  active,
  sceneReady,
  step1,
  step2,
  step3,
  step4,
}) {
  if (!active || !sceneReady) return null;
  if (step1 === 'error' || step2 === 'error' || step3 === 'error' || step4 === 'error') {
    return 'error';
  }
  if (step1 === 'idle') return 'step1';
  if (step1 !== 'complete') return null;
  if (step2 === 'idle') return 'step2';
  if (step2 !== 'complete') return null;
  if (step3 === 'idle') return 'step3';
  if (step3 !== 'complete') return null;
  if (step4 === 'idle') return 'step4';
  if (step4 !== 'complete') return null;
  return 'complete';
}

export function frankaDemo1DisplayAction(state) {
  if (!state.active) return null;
  const next = nextFrankaDemo1Action(state);
  if (next) return next;
  if (state.step1 !== 'complete') return 'step1';
  if (state.step2 !== 'complete') return 'step2';
  if (state.step3 !== 'complete') return 'step3';
  return 'step4';
}

export function frankaDemo1StatusText(action) {
  const copy = {
    step1: 'Positioning all four arms',
    step2: 'Establishing physical grasps',
    step3: 'Transporting and installing the cross member',
    step4: 'Installing and striking the fastener',
    complete: 'Demo complete',
    error: 'Run stopped. Press Reset to try again.',
  };
  return copy[action] ?? 'Ready to play';
}
