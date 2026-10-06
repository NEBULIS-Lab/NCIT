import type { AssemblyStep1Status } from './assemblyStep1.js';
import type { AssemblyStep2Phase, AssemblyStep2State } from './assemblyStep2.js';
import type { AssemblyStep3Phase, AssemblyStep3State } from './assemblyStep3.js';
import type { AssemblyStep4Phase, AssemblyStep4State } from './assemblyStep4.js';

const step1Copy: Record<AssemblyStep1Status, { button: string; status: string }> = {
  idle: { button: 'Step 1: Move into position', status: 'Ready' },
  planning: { button: 'Planning four-arm trajectories…', status: 'Planning' },
  running: { button: 'Running Step 1…', status: 'In progress' },
  complete: { button: 'Step 1 complete', status: 'All four arms are at their pre-grasp positions' },
  error: { button: 'Step 1 planning failed', status: 'Press Reset and try again' },
};

const step2PhaseCopy: Record<AssemblyStep2Phase, string> = {
  idle: 'Waiting for Step 1',
  planning: 'Checking grasp preconditions',
  approach: 'All four arms are approaching grasp height',
  'slow-descent': 'All four arms are descending slowly to contact',
  'contact-settle': 'Holding grippers open while approach poses settle',
  'frame-clamp': 'Arm 1 is gripping the frame',
  'frame-verification': 'Verifying contact on both sides of the frame',
  'cross-member-clamp': 'Arms 3/4 are gripping the cross-member together',
  'cross-member-verification': 'Verifying all four finger contacts on the cross-member',
  'hammer-clamp': 'Arm 2 is gripping the hammer handle',
  'tool-verification': 'Verifying contact on both sides of the tool',
  'clamped-hold': 'Verifying four stable grasps',
  complete: 'Step 2 complete: all four physical grasps verified',
  error: 'Step 2 failed',
};

function step2ButtonCopy(phase: AssemblyStep2Phase) {
  if (phase === 'idle') return 'Step 2: Lower and grasp';
  if (phase === 'complete') return 'Step 2 complete: grasps verified';
  if (phase === 'error') return 'Step 2 failed';
  return 'Running Step 2…';
}

const step3PhaseCopy: Record<AssemblyStep3Phase, string> = {
  idle: 'Waiting for Step 2',
  planning: 'Checking transfer preconditions',
  'grasp-check': 'Confirming all four physical grasps',
  lift: 'Arm 2 is lifting the hammer; Arms 3/4 are lifting the cross-member',
  'lift-settle': 'Cross-member clear of the tray; verifying the two-arm hold',
  'transfer-a': 'Arm 2 is staging the hammer while Arms 3/4 move the cross-member',
  'transfer-b': 'Moving the cross-member directly above the frame',
  'hover-settle': 'Stabilizing the cross-member above the frame',
  'aligned-descent': 'Lowering slowly and aligning the mounting holes',
  'alignment-verification': 'Checking all four holes against the frame interfaces',
  'aligned-hold': 'Verifying a stable, aligned hold',
  'reseat-lift': 'Alignment not settled; lifting the cross-member to reseat',
  'reseat-descent': 'Making one slow reseating attempt',
  release: 'Alignment confirmed; Arms 3/4 are releasing the cross-member',
  'release-settle': 'Cross-member released; waiting for it to settle',
  retreat: 'Arms 3/4 are retreating to their home positions',
  'placed-verification': 'Checking cross-member stability with grippers released',
  complete: 'Step 3 complete: hammer staged, cross-member seated, Arms 3/4 home',
  error: 'Step 3 failed',
};

function step3ButtonCopy(phase: AssemblyStep3Phase) {
  if (phase === 'idle') return 'Step 3: Transfer and align';
  if (phase === 'complete') return 'Step 3 complete: cross-member seated';
  if (phase === 'error') return 'Step 3 failed';
  return 'Running Step 3…';
}

const step4PhaseCopy: Record<AssemblyStep4Phase, string> = {
  idle: 'Waiting for Step 3',
  planning: 'Checking fastener installation preconditions',
  'donor-tighten': 'Arm 2 is tightening its hammer grip for handover',
  prepare: 'Arm 3 is approaching the fastener; Arm 4 is approaching the hammer in Arm 2',
  engage: 'Arm 3 is aligning with the fastener; Arm 4 with the hammer handle',
  'engage-settle': 'Stabilizing the fastener pickup and hammer handover poses',
  'dual-clamp': 'Arm 3 is gripping the fastener while Arm 4 grips the hammer handle',
  'handover-verification': 'Verifying Arm 3 fastener grip and Arm 4 bilateral hammer contact',
  'hammer-release': 'Handover confirmed; Arm 2 is releasing the hammer handle',
  'donor-clear': 'Arm 2 is clearing the handover area; Arm 4 is holding the hammer',
  'receiver-align': 'Arm 4 is aligning its grip with the actual hammer handle orientation',
  'receiver-retreat': 'Arm 4 is carrying the hammer to its safe waiting position',
  'fastener-tighten': 'Arm 3 is lowering to grip the fastener; Arm 4 is retreating with the hammer',
  'fastener-grip-settle': 'Arm 3 is holding its pickup pose while the gripper closes',
  'fastener-grasp-verification': 'Verifying Arm 3 contact on both sides of the fastener',
  lift: 'Arm 3 is lifting the fastener from the tray',
  transfer: 'Arm 3 is moving the fastener above the mounting hole',
  'transfer-settle': 'Arm 3 is stabilizing the fastener above the mounting hole',
  insert: 'Arm 3 is inserting the fastener into the northwest interface',
  'fastener-release': 'Fastener in position; Arm 3 is opening its gripper',
  clear: 'Arm 3 is retreating; Arm 4 is waiting with the hammer',
  'placement-verification': 'Checking fastener placement with the gripper released',
  'hammer-stage': 'Arm 4 is positioning the hammer head above the fastener',
  'hammer-strike': 'Arm 4 is tapping the fastener',
  'hammer-recover': 'Arm 4 is lifting the hammer clear of the mounting interface',
  'support-approach': 'Arms 2/3 are approaching the frame support points',
  'support-clamp': 'Arms 1/2/3 are gripping the frame to stabilize it',
  'support-release': 'Tap complete; Arms 1/2/3 are releasing the frame',
  'support-clear': 'Arms 1/2/3 are lifting their grippers clear of the frame',
  'return-home': 'All four arms are returning home',
  'hammer-return': 'Arm 4 is returning the hammer to the west-side supports',
  'hammer-lower': 'Arm 4 is lowering the hammer',
  'tool-release': 'Hammer on its supports; Arm 4 is opening its gripper',
  'tool-clear': 'Arm 4 is clearing the hammer before returning home',
  complete: 'Step 4 complete: fastener seated and tapped',
  error: 'Step 4 failed',
};

function step4ButtonCopy(phase: AssemblyStep4Phase) {
  if (phase === 'idle') return 'Step 4: Insert fastener and tap';
  if (phase === 'complete') return 'Step 4 complete: fastener tapped';
  if (phase === 'error') return 'Step 4 failed';
  return 'Running Step 4…';
}

export function AssemblySequencePanel({
  step1Status,
  step2State,
  step3State,
  step4State,
  canRunStep2,
  canRunStep3,
  canRunStep4,
  onRunStep1,
  onRunStep2,
  onRunStep3,
  onRunStep4,
}: {
  step1Status: AssemblyStep1Status;
  step2State: AssemblyStep2State;
  step3State: AssemblyStep3State;
  step4State: AssemblyStep4State;
  canRunStep2: boolean;
  canRunStep3: boolean;
  canRunStep4: boolean;
  onRunStep1: () => void;
  onRunStep2: () => void;
  onRunStep3: () => void;
  onRunStep4: () => void;
}) {
  const first = step1Copy[step1Status];
  const failure = step2State.failure;
  return (
    <section className="assembly-sequence-panel" aria-label="Assembly1 action sequence">
      <div className="assembly-sequence-panel__title">Assembly1 Actions</div>
      <div className="assembly-sequence-panel__step">
        <div className="assembly-sequence-panel__status">{first.status}</div>
        <button type="button" onClick={onRunStep1} disabled={step1Status !== 'idle'}>
          {first.button}
        </button>
      </div>
      <div className="assembly-sequence-panel__step">
        <div
          className={`assembly-sequence-panel__status${
            step2State.phase === 'error' ? ' assembly-sequence-panel__status--error' : ''
          }`}
        >
          {step2PhaseCopy[step2State.phase]}
          {failure && (
            <span>
              {`: ${failure.armKey ?? 'System'} / ${failure.code}`}
              {failure.detail ? ` / ${failure.detail}` : ''}
              {'. Press Reset and try again.'}
            </span>
          )}
        </div>
        <button type="button" onClick={onRunStep2} disabled={!canRunStep2}>
          {step2ButtonCopy(step2State.phase)}
        </button>
      </div>
      <div className="assembly-sequence-panel__step">
        <div
          className={`assembly-sequence-panel__status${
            step3State.phase === 'error' ? ' assembly-sequence-panel__status--error' : ''
          }`}
        >
          {step3PhaseCopy[step3State.phase]}
          {step3State.failure && (
            <span>
              {`: ${step3State.failure.armKey ?? 'System'} / ${step3State.failure.code}`}
              {step3State.failure.detail ? ` / ${step3State.failure.detail}` : ''}
              {'. Press Reset and try again.'}
            </span>
          )}
        </div>
        <button type="button" onClick={onRunStep3} disabled={!canRunStep3}>
          {step3ButtonCopy(step3State.phase)}
        </button>
      </div>
      <div className="assembly-sequence-panel__step">
        <div
          className={`assembly-sequence-panel__status${
            step4State.phase === 'error' ? ' assembly-sequence-panel__status--error' : ''
          }`}
        >
          {step4PhaseCopy[step4State.phase]}
          {step4State.failure && (
            <span>
              {`: ${step4State.failure.armKey ?? 'System'} / ${step4State.failure.code}`}
              {step4State.failure.detail ? ` / ${step4State.failure.detail}` : ''}
              {'. Press Reset and try again.'}
            </span>
          )}
        </div>
        <button type="button" onClick={onRunStep4} disabled={!canRunStep4}>
          {step4ButtonCopy(step4State.phase)}
        </button>
      </div>
    </section>
  );
}
