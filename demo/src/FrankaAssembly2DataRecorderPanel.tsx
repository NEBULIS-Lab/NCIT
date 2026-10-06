import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  findActuatorByName,
  findBodyByName,
  findJointByName,
  findSiteByName,
  useBeforePhysicsStep,
  useMujoco,
} from 'mujoco-react';
import type { MujocoData, MujocoModel } from 'mujoco-react';
import type { ControlTarget } from './controlTargets.js';

const RECORDER_SCHEMA_VERSION = 'franka-assembly2-demorecord-v1.2';
const RECORDER_OBJECT_NAMES = [
  'assembly_frame',
  'cross_member',
  'manual_screwdriver',
  'torque_driver',
] as const;

interface ArmCaptureProfile {
  armKey: string;
  jointNames: string[];
  qposAddresses: number[];
  qvelAddresses: number[];
  actuatorIndices: number[];
  gripperActuatorIndex: number | null;
  tcpSiteName: string;
  tcpSiteId: number;
  baseBodyName: string;
  baseBodyId: number;
}

interface ObjectCaptureProfile {
  name: string;
  bodyId: number;
}

interface ArmBaselineSample {
  qpos: number[];
  qvel: number[];
  ctrl: number[];
  gripper: number | null;
}

interface ArmFrameSample {
  qpos: number[];
  qvel: number[];
  ctrl: number[];
  gripper: number | null;
  tcp: {
    position: [number, number, number];
    quaternion: [number, number, number, number];
    xmat: number[];
  };
  base: {
    position: [number, number, number];
    quaternion: [number, number, number, number];
  };
}

interface FrameObjectSample {
  position: [number, number, number];
  quaternion: [number, number, number, number];
}

interface DemoFrame {
  index: number;
  simTime: number;
  wallTime: string;
  selectedControlTarget: string;
  arms: Record<string, ArmFrameSample>;
  objects: Record<string, FrameObjectSample>;
}

interface RecorderMetadata {
  schemaVersion: string;
  scene: 'frankaAssembly2';
  robot: 'Franka Panda';
  createdAt: string;
  recordingStartedAt: string;
  recordingStartedSimTime: number;
  recordingEndedAt: string;
  recordingEndedSimTime: number;
  armProfiles: ArmCaptureProfile[];
  objectProfiles: string[];
  frameCount: number;
  notes: string;
}

interface SerializedRecord {
  metadata: RecorderMetadata;
  frames: DemoFrame[];
}

interface FrankaAssembly2DataRecorderPanelProps {
  targets: ControlTarget[];
  activeTarget: ControlTarget;
  resetGeneration: number;
}

const tempMatrix = new THREE.Matrix4();
const tempQuaternion = new THREE.Quaternion();

function vector3(values: Float64Array, index: number): [number, number, number] {
  const offset = index * 3;
  return [values[offset], values[offset + 1], values[offset + 2]];
}

function quaternionFromMat(values: Float64Array, index: number): [number, number, number, number] {
  tempMatrix.fromArray([
    values[index],
    values[index + 1],
    values[index + 2],
    0,
    values[index + 3],
    values[index + 4],
    values[index + 5],
    0,
    values[index + 6],
    values[index + 7],
    values[index + 8],
    0,
    0,
    0,
    0,
    1,
  ]);
  tempQuaternion.setFromRotationMatrix(tempMatrix).normalize();
  return [tempQuaternion.x, tempQuaternion.y, tempQuaternion.z, tempQuaternion.w];
}

function quaternion4(values: Float64Array, index: number): [number, number, number, number] {
  return [values[index], values[index + 1], values[index + 2], values[index + 3]];
}

function formatFilename(prefix: string) {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  }`;
  return `${prefix}_${stamp}.json`;
}

function hasKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

function armDisplayLabel(armKey: string, targets: ControlTarget[]) {
  return targets.find((target) => target.key === armKey)?.label ?? armKey;
}

function parseArmProfiles(
  model: MujocoModel,
  targets: ControlTarget[],
): { profiles: ArmCaptureProfile[]; objects: ObjectCaptureProfile[]; error: string | null } {
  const armTargets = targets
    .filter((target) => /^r\d+$/.test(target.key))
    .sort((a, b) => Number(a.key.slice(1)) - Number(b.key.slice(1)))
    .filter((_, index) => index < 4);

  if (armTargets.length !== 4) {
    return {
      profiles: [],
      objects: [],
      error: `预期4条臂，但解析到 ${armTargets.length} 条可控机械臂`,
    };
  }

  const profiles: ArmCaptureProfile[] = [];
  for (const target of armTargets) {
    if (!target.ik) {
      return {
        profiles: [],
        objects: [],
        error: `臂 ${target.label} 缺少 IK 配置`,
      };
    }

    const jointIds = target.ik.jointNames.map((name) => findJointByName(model, name));
    if (jointIds.some((id) => id < 0)) {
      return {
        profiles: [],
        objects: [],
        error: `臂 ${target.label} 关节名未解析`,
      };
    }

    const qposAddresses = jointIds.map((jointId) => model.jnt_qposadr[jointId]);
    const qvelAddresses = jointIds.map((jointId) => model.jnt_dofadr[jointId]);
    const tcpSiteId = findSiteByName(model, target.ik.siteName);
    if (tcpSiteId < 0) {
      return {
        profiles: [],
        objects: [],
        error: `臂 ${target.label} TCP 站点缺失: ${target.ik.siteName}`,
      };
    }

    const baseBodyName = `${target.prefix}link0`;
    const baseBodyId = findBodyByName(model, baseBodyName);
    if (baseBodyId < 0) {
      return {
        profiles: [],
        objects: [],
        error: `臂 ${target.label} 底座缺失: ${baseBodyName}`,
      };
    }

    let gripperActuatorIndex: number | null = null;
    if (target.gripperActuator) {
      const index = findActuatorByName(model, target.gripperActuator);
      if (index < 0) {
        return {
          profiles: [],
          objects: [],
          error: `臂 ${target.label} 夹爪执行器缺失: ${target.gripperActuator}`,
        };
      }
      gripperActuatorIndex = index;
    }

    profiles.push({
      armKey: target.key,
      jointNames: [...target.ik.jointNames],
      qposAddresses,
      qvelAddresses,
      actuatorIndices: [...target.ik.actuatorIndices],
      gripperActuatorIndex,
      tcpSiteName: target.ik.siteName,
      tcpSiteId,
      baseBodyName,
      baseBodyId,
    });
  }

  const objectProfiles: ObjectCaptureProfile[] = RECORDER_OBJECT_NAMES
    .map((name) => ({ name, bodyId: findBodyByName(model, name) }))
    .filter((entry) => entry.bodyId >= 0);

  return {
    profiles,
    objects: objectProfiles,
    error: null,
  };
}

export function FrankaAssembly2DataRecorderPanel({
  targets,
  activeTarget,
  resetGeneration,
}: FrankaAssembly2DataRecorderPanelProps) {
  const simulation = useMujoco();
  const [error, setError] = useState('');
  const [armProfiles, setArmProfiles] = useState<ArmCaptureProfile[]>([]);
  const [objectProfiles, setObjectProfiles] = useState<ObjectCaptureProfile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [frames, setFrames] = useState<DemoFrame[]>([]);
  const [startedAt, setStartedAt] = useState('');
  const [startSimTime, setStartSimTime] = useState(0);
  const [selectedArms, setSelectedArms] = useState<Record<string, boolean>>({});

  const frameRef = useRef<DemoFrame[]>([]);
  const profilesRef = useRef<ArmCaptureProfile[]>([]);
  const objectProfilesRef = useRef<ObjectCaptureProfile[]>([]);
  const isRecordingRef = useRef(false);
  const baselineRef = useRef<Record<string, ArmBaselineSample> | null>(null);
  const pendingResetRef = useRef<string[] | null>(null);

  const resolveProfilesFromModel = useCallback(() => {
    const model = simulation.mjModelRef?.current;
    if (!model) {
      setError('模型未就绪，无法读取可采集臂和目标列表');
      setArmProfiles([]);
      setObjectProfiles([]);
      profilesRef.current = [];
      objectProfilesRef.current = [];
      return;
    }

    const result = parseArmProfiles(model, targets);
    if (result.error) {
      setError(result.error);
      setArmProfiles([]);
      setObjectProfiles([]);
      profilesRef.current = [];
      objectProfilesRef.current = [];
      return;
    }

    profilesRef.current = result.profiles;
    objectProfilesRef.current = result.objects;
    setArmProfiles(result.profiles);
    setObjectProfiles(result.objects);
    setError('');
  }, [targets, simulation]);

  useEffect(() => {
    resolveProfilesFromModel();
  }, [resolveProfilesFromModel, simulation.status]);

  useEffect(() => {
    setSelectedArms(
      Object.fromEntries(armProfiles.map((profile) => [profile.armKey, true])) as Record<string, boolean>,
    );
  }, [armProfiles]);

  const readArmState = useCallback((data: MujocoData, profile: ArmCaptureProfile): ArmFrameSample => {
    const qpos = profile.qposAddresses.map((address) => data.qpos[address]);
    const qvel = profile.qvelAddresses.map((address) => data.qvel[address]);
    const ctrl = profile.actuatorIndices.map((index) => data.ctrl[index]);
    const tcpMatOffset = profile.tcpSiteId * 9;

    return {
      qpos,
      qvel,
      ctrl,
      gripper: profile.gripperActuatorIndex === null
        ? null
        : data.ctrl[profile.gripperActuatorIndex],
      tcp: {
        position: vector3(data.site_xpos, profile.tcpSiteId),
        quaternion: quaternionFromMat(data.site_xmat, tcpMatOffset),
        xmat: Array.from(data.site_xmat.slice(tcpMatOffset, tcpMatOffset + 9)),
      },
      base: {
        position: vector3(data.xpos, profile.baseBodyId),
        quaternion: quaternion4(data.xquat, profile.baseBodyId * 4),
      },
    };
  }, []);

  const createFrame = useCallback((data: MujocoData): DemoFrame | null => {
    if (profilesRef.current.length === 0) return null;

    const arms = Object.fromEntries(
      profilesRef.current.map((profile) => [profile.armKey, readArmState(data, profile)]),
    ) as DemoFrame['arms'];

    const objects = Object.fromEntries(
      objectProfilesRef.current
        .map((entry) => [
          entry.name,
          {
            position: vector3(data.xpos, entry.bodyId),
            quaternion: quaternion4(data.xquat, entry.bodyId * 4),
          },
        ]),
    );

    return {
      index: frameRef.current.length,
      simTime: data.time,
      wallTime: new Date().toISOString(),
      selectedControlTarget: activeTarget.key,
      arms,
      objects,
    };
  }, [activeTarget.key, readArmState]);

  const captureBaseline = useCallback((data: MujocoData) => {
    const baseline: Record<string, ArmBaselineSample> = {};
    for (const profile of profilesRef.current) {
      baseline[profile.armKey] = {
        qpos: profile.qposAddresses.map((address) => data.qpos[address]),
        qvel: profile.qvelAddresses.map((address) => data.qvel[address]),
        ctrl: profile.actuatorIndices.map((index) => data.ctrl[index]),
        gripper: profile.gripperActuatorIndex === null
          ? null
          : data.ctrl[profile.gripperActuatorIndex],
      };
    }
    baselineRef.current = baseline;
  }, []);

  const appendFrame = useCallback(() => {
    const data = simulation.mjDataRef?.current;
    if (!data) return;
    if (!isRecordingRef.current) return;
    if (profilesRef.current.length === 0) {
      setError('未解析到可记录臂，无法采集');
      return;
    }
    const frame = createFrame(data);
    if (!frame) return;

    const nextFrames = [...frameRef.current, frame];
    frameRef.current = nextFrames;
    setFrames(nextFrames);
  }, [createFrame, simulation]);

  const startRecording = useCallback(() => {
    const data = simulation.mjDataRef?.current;
    if (!data || profilesRef.current.length === 0) {
      setError('场景未就绪，无法开始记录');
      return;
    }
    const now = new Date();
    setFrames([]);
    frameRef.current = [];
    captureBaseline(data);
    setError('');
    setStartedAt(now.toISOString());
    setStartSimTime(data.time);
    setIsRecording(true);
    isRecordingRef.current = true;
  }, [captureBaseline, simulation]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    isRecordingRef.current = false;
  }, []);

  const clearSession = useCallback(() => {
    setFrames([]);
    setStartedAt('');
    setStartSimTime(0);
    setError('');
    setIsRecording(false);
    isRecordingRef.current = false;
    baselineRef.current = null;
    frameRef.current = [];
  }, []);

  const deleteFrame = useCallback((frameIndex: number) => {
    const next = frameRef.current.filter((frame) => frame.index !== frameIndex);
    frameRef.current = next.map((frame, index) => ({ ...frame, index }));
    setFrames(frameRef.current);
  }, []);

  const deleteLastFrame = useCallback(() => {
    if (frameRef.current.length === 0) return;
    deleteFrame(frameRef.current.length - 1);
  }, [deleteFrame]);

  const download = useCallback(() => {
    if (frameRef.current.length === 0) return;
    if (!activeTarget) return;

    const first = frameRef.current[0];
    const last = frameRef.current[frameRef.current.length - 1];

    const payload: SerializedRecord = {
      metadata: {
        schemaVersion: RECORDER_SCHEMA_VERSION,
        scene: 'frankaAssembly2',
        robot: 'Franka Panda',
        createdAt: new Date().toISOString(),
        recordingStartedAt: startedAt || first.wallTime,
        recordingStartedSimTime: startSimTime || first.simTime,
        recordingEndedAt: new Date().toISOString(),
        recordingEndedSimTime: last.simTime,
        armProfiles: profilesRef.current,
        objectProfiles: objectProfilesRef.current.map((entry) => entry.name),
        frameCount: frameRef.current.length,
        notes: `Active control target at finish: ${activeTarget.label}`,
      },
      frames: frameRef.current,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = formatFilename('franka-assembly2-demorecord');
    anchor.style.opacity = '0';
    anchor.style.position = 'fixed';
    anchor.style.left = '-9999px';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [activeTarget.label, startedAt, startSimTime]);

  const requestResetSelectedArms = useCallback(() => {
    const selected = Object.entries(selectedArms)
      .filter(([, active]) => active)
      .map(([armKey]) => armKey);

    if (selected.length === 0) {
      setError('请先勾选要重置的机械臂');
      return;
    }
    if (!baselineRef.current) {
      setError('尚无基准位姿（请先开始记录）');
      return;
    }

    pendingResetRef.current = selected;
    setError('');
  }, [selectedArms]);

  const applyBaselineToSelectedArms = useCallback((data: MujocoData) => {
    const pending = pendingResetRef.current;
    if (!pending || !baselineRef.current) {
      pendingResetRef.current = null;
      return;
    }

    for (const armKey of pending) {
      const profile = profilesRef.current.find((entry) => entry.armKey === armKey);
      if (!profile) continue;
      const baseline = baselineRef.current[armKey];
      if (!baseline) continue;

      for (let index = 0; index < profile.qposAddresses.length; index += 1) {
        const address = profile.qposAddresses[index];
        data.qpos[address] = baseline.qpos[index];
      }
      for (let index = 0; index < profile.qvelAddresses.length; index += 1) {
        const address = profile.qvelAddresses[index];
        data.qvel[address] = baseline.qvel[index] ?? 0;
      }
      for (let index = 0; index < profile.actuatorIndices.length; index += 1) {
        const address = profile.actuatorIndices[index];
        data.ctrl[address] = baseline.ctrl[index] ?? 0;
      }
      if (profile.gripperActuatorIndex !== null) {
        const gripperValue = baseline.gripper;
        if (gripperValue != null) {
          data.ctrl[profile.gripperActuatorIndex] = gripperValue;
        }
      }
    }

    pendingResetRef.current = null;
  }, []);

  useBeforePhysicsStep((model, data) => {
    void model;
    if (pendingResetRef.current) {
      applyBaselineToSelectedArms(data);
    }
  });

  const toggleArm = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedArms((previous) => ({ ...previous, [value]: checked }));
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!event.altKey || !event.shiftKey) return;
    if (event.ctrlKey || event.metaKey || event.repeat) return;
    if (hasKeyboardTarget(event.target)) return;

    switch (event.code) {
      case 'KeyR': {
        event.preventDefault();
        if (isRecordingRef.current) {
          stopRecording();
        } else {
          startRecording();
        }
        break;
      }
      case 'KeyP': {
        event.preventDefault();
        if (isRecordingRef.current) {
          appendFrame();
        } else {
          setError('请先点击“开始记录”或按 Alt+Shift+R 开始记录');
        }
        break;
      }
      case 'KeyS': {
        event.preventDefault();
        if (frameRef.current.length > 0) {
          download();
          stopRecording();
        }
        break;
      }
      case 'KeyD': {
        event.preventDefault();
        deleteLastFrame();
        break;
      }
      case 'KeyC': {
        event.preventDefault();
        clearSession();
        break;
      }
      case 'KeyX': {
        event.preventDefault();
        requestResetSelectedArms();
        break;
      }
      default:
        break;
    }
  }, [
    appendFrame,
    clearSession,
    deleteLastFrame,
    download,
    requestResetSelectedArms,
    startRecording,
    stopRecording,
    setError,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    clearSession();
    isRecordingRef.current = false;
  }, [clearSession, resetGeneration]);

  return (
    <Html
      fullscreen
      style={{ pointerEvents: 'none' }}
      calculatePosition={(_object, _camera, size) => [size.width / 2, size.height / 2]}
    >
      <section className="franka-recorder-panel" aria-label="Franka Assembly2 示教采集">
      <div className="franka-recorder-panel__title">Franka Assembly2 数据采集</div>
      <div className="franka-recorder-panel__line">
        可采集机械臂：{armProfiles.length > 0
          ? armProfiles.map((profile) => armDisplayLabel(profile.armKey, targets)).join(' / ')
          : '未解析'}
      </div>
      <div className="franka-recorder-panel__line">
        当前对象：{objectProfiles.map((obj) => obj.name).join(' / ') || '未解析'}
      </div>
      <div className="franka-recorder-panel__line">
        当前状态：{isRecording ? `记录中（${frames.length} 帧）` : '未记录'}
      </div>
      {error && <div className="franka-recorder-panel__line franka-recorder-panel__error">{error}</div>}

      <div className="franka-recorder-panel__row">
        <button type="button" onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? '停止记录' : '开始记录'}
        </button>
        <button type="button" onClick={appendFrame} disabled={!isRecording}>
          记录当前位置
        </button>
      </div>
      <div className="franka-recorder-panel__row">
        <button type="button" onClick={download} disabled={frames.length === 0}>
          完成记录并下载 JSON
        </button>
        <button type="button" onClick={deleteLastFrame} disabled={frames.length === 0}>
          删除最后一条
        </button>
      </div>
      <div className="franka-recorder-panel__row">
        <button type="button" onClick={clearSession}>清空重录</button>
        <button type="button" onClick={requestResetSelectedArms} disabled={!baselineRef.current}>
          重置选中的臂到开始姿态
        </button>
      </div>

      <div className="franka-recorder-panel__section">
        <div className="franka-recorder-panel__section-title">选择重置臂（默认四个均选中）</div>
        <div className="franka-recorder-panel__checkboxes">
          {Object.entries(selectedArms).map(([armKey]) => (
            <label key={armKey} className="franka-recorder-panel__checkline">
              <input
                type="checkbox"
                value={armKey}
                checked={selectedArms[armKey]}
                onChange={toggleArm}
              />
              {armDisplayLabel(armKey, targets)}
            </label>
          ))}
        </div>
      </div>

      <div className="franka-recorder-panel__section">
        <div className="franka-recorder-panel__section-title">已记录位姿（可逐条删除）</div>
        <div className="franka-recorder-panel__frames">
          {frames.length === 0 && <div className="franka-recorder-panel__line">暂无记录</div>}
          {frames.map((frame) => (
            <div key={frame.index} className="franka-recorder-panel__frame-row">
              <span className="franka-recorder-panel__frame-meta">
                #{frame.index + 1}，t={frame.simTime.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => deleteFrame(frame.index)}
                aria-label={`删除第 ${frame.index + 1} 条记录`}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="franka-recorder-panel__line franka-recorder-panel__hint">
        快捷键：Alt+Shift+R 开始/停止、Alt+Shift+P 记录、Alt+Shift+S 完成导出、
        Alt+Shift+D 删除最后一条、Alt+Shift+C 清空重录、Alt+Shift+X 重置选中臂
      </div>
      </section>
    </Html>
  );
}
