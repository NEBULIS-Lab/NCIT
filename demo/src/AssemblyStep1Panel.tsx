import type { AssemblyStep1Status } from './assemblyStep1.js';

const statusCopy: Record<AssemblyStep1Status, { button: string; status: string }> = {
  idle: { button: 'Step 1: Move into position', status: 'Ready' },
  planning: { button: 'Planning four-arm trajectories…', status: 'Planning' },
  running: { button: 'Running Step 1…', status: 'In progress' },
  complete: { button: 'Step 1 complete', status: 'All four arms are at their pre-grasp positions' },
  error: { button: 'Step 1 planning failed', status: 'Press Reset and try again' },
};

export function AssemblyStep1Panel({
  status,
  onRun,
}: {
  status: AssemblyStep1Status;
  onRun: () => void;
}) {
  const copy = statusCopy[status];
  return (
    <section className="assembly-step1-panel" aria-label="Assembly1 first action">
      <div className="assembly-step1-panel__title">Assembly1 Actions</div>
      <div className="assembly-step1-panel__status">{copy.status}</div>
      <button
        type="button"
        onClick={onRun}
        disabled={status !== 'idle'}
      >
        {copy.button}
      </button>
    </section>
  );
}
