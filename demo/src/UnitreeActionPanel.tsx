import type { UnitreeActionState } from './unitreeActionState.js';
import {
  UNITREE_ACTION_PROGRAMS,
  getUnitreeActionProgram,
} from './unitreeActionSequence.js';
import type { UnitreeActionProgramId } from './unitreeActionSequence.js';

const PHASE_COPY: Record<UnitreeActionState['phase'], string> = {
  settle: '稳定站姿',
  'rise-greet': 'G1 抬臂，Go2 起身',
  'scan-wave': 'G1 挥手，机械臂扫描',
  lower: 'Go2 下蹲，G1 收臂',
  recover: '恢复站姿',
  'g1-squat': 'G1 下蹲',
  'g1-stand': 'G1 起立',
  'g1-walk': 'G1 行走',
  'g1-stabilize': 'G1 稳定',
  'go2-walk': 'Go2 行走',
  'go2-stabilize': 'Go2 稳定',
  'final-greeting': '最终问候与扫描',
  'final-hold': '最终稳定',
  complete: '动作完成',
};

const STATUS_COPY: Record<UnitreeActionState['status'], string> = {
  idle: '待执行',
  running: '运行中',
  paused: '已暂停（动力学继续）',
  complete: '已完成',
  error: '执行错误',
};

export function UnitreeActionPanel({
  state,
  loading,
  onRun,
  onPause,
  onResume,
  onRestart,
  onProgramChange,
}: {
  state: UnitreeActionState;
  loading: boolean;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onProgramChange: (programId: UnitreeActionProgramId) => void;
}) {
  const program = getUnitreeActionProgram(state.programId);
  const selectionLocked = state.status === 'running' || state.status === 'paused';
  return (
    <section className="unitree-action-panel" aria-label="Unitree 连贯动作控制">
      <div className="unitree-action-panel__eyebrow">
        ACTUATOR ACTION · {program.duration.toFixed(1)} s
      </div>
      <h2>Unitree 连贯动作</h2>
      <label className="unitree-action-panel__program">
        <span>动作程序</span>
        <select
          value={state.programId}
          disabled={loading || selectionLocked}
          onChange={(event) => onProgramChange(event.target.value as UnitreeActionProgramId)}
        >
          {Object.values(UNITREE_ACTION_PROGRAMS).map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label} · {entry.duration.toFixed(1)} s
            </option>
          ))}
        </select>
      </label>
      <div className="unitree-action-panel__metrics">
        <span>{STATUS_COPY[state.status]}</span>
        <strong>{state.elapsed.toFixed(1)} s</strong>
      </div>
      <div className="unitree-action-panel__phase">{PHASE_COPY[state.phase]}</div>
      {state.error && <div className="unitree-action-panel__error">{state.error}</div>}
      <div className="unitree-action-panel__controls">
        <button
          type="button"
          onClick={onRun}
          disabled={loading || (state.status !== 'idle' && state.status !== 'complete')}
        >
          执行完整动作
        </button>
        {state.status === 'running' && (
          <button type="button" onClick={onPause}>暂停</button>
        )}
        {state.status === 'paused' && (
          <button type="button" onClick={onResume}>继续</button>
        )}
        <button type="button" onClick={onRestart} disabled={loading}>重新开始</button>
      </div>
      <p>仅写入 47 个关节执行器目标；行走位移、重力、碰撞与自由根均由 MuJoCo 求解。</p>
    </section>
  );
}
