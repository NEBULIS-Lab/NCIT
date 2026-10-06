import { useEffect, useRef, type MutableRefObject } from 'react';
import {
  findActuatorByName,
  findJointByName,
  useBeforePhysicsStep,
  useMujoco,
} from 'mujoco-react';
import type { MujocoModel } from 'mujoco-react';

import {
  G1_ACTUATORS,
  GO2_ACTUATORS,
  applyUnitreeActionTargets,
  getUnitreeActionProgram,
  isControlRangeCompatible,
  sampleUnitreeAction,
} from './unitreeActionSequence.js';
import { sampleUnitreeLocomotionAction } from './unitreeLocomotionController.js';
import {
  computeRootDisplacement,
  readUnitreeRootState,
  resolveUnitreeFreeRootAddresses,
  validateLocomotionTargets,
  validateUnitreeDynamicsState,
} from './unitreeDynamicsAdapter.js';
import {
  completeAction,
  failAction,
} from './unitreeActionState.js';
import type { UnitreeActionState } from './unitreeActionState.js';
import type {
  UnitreeActionSample,
  UnitreeActuatorIds,
} from './unitreeActionSequence.js';
import type {
  UnitreeFreeRootAddresses,
  UnitreeRootState,
  UnitreeRuntimeDiagnostics,
} from './unitreeDynamicsAdapter.js';

interface UnitreeActionControllerProps {
  requestId: number;
  resetGeneration: number;
  state: UnitreeActionState;
  diagnosticsRef: MutableRefObject<UnitreeRuntimeDiagnostics | null>;
  onStateChange: (state: UnitreeActionState) => void;
}

type UnitreeRoots = { g1: UnitreeRootState; go2: UnitreeRootState };

function resolveActuators(model: MujocoModel): UnitreeActuatorIds {
  const resolveGroup = (actuators: typeof G1_ACTUATORS) => actuators.map(({ name, min, max }) => {
    const id = findActuatorByName(model, name);
    if (id < 0) throw new Error(`找不到执行器 ${name}`);
    const rangeMin = model.actuator_ctrlrange[id * 2];
    const rangeMax = model.actuator_ctrlrange[id * 2 + 1];
    if (!isControlRangeCompatible({ name, min, max }, rangeMin, rangeMax)) {
      throw new Error(`执行器 ${name} 的控制范围与动作定义不一致`);
    }
    return id;
  });
  const ids = {
    g1: resolveGroup(G1_ACTUATORS),
    go2: resolveGroup(GO2_ACTUATORS),
  };
  if (new Set([...ids.g1, ...ids.go2]).size !== 47) {
    throw new Error('动作执行器映射存在重复项');
  }
  return ids;
}

export function UnitreeActionController({
  requestId,
  resetGeneration,
  state,
  diagnosticsRef,
  onStateChange,
}: UnitreeActionControllerProps) {
  const simulation = useMujoco();
  const actuatorIdsRef = useRef<UnitreeActuatorIds | null>(null);
  const rootAddressesRef = useRef<UnitreeFreeRootAddresses | null>(null);
  const initialRootsRef = useRef<UnitreeRoots | null>(null);
  const elapsedRef = useRef(0);
  const lastPhysicsTimeRef = useRef(0);
  const lastSampleRef = useRef<UnitreeActionSample>(sampleUnitreeAction(0));
  const processedRequestRef = useRef(0);
  const lastPublishedElapsedRef = useRef(0);
  const stateRef = useRef(state);
  const onStateChangeRef = useRef(onStateChange);
  stateRef.current = state;
  onStateChangeRef.current = onStateChange;

  const readRoots = (data: { qpos: ArrayLike<number>; qvel: ArrayLike<number> }) => {
    const addresses = rootAddressesRef.current;
    if (!addresses) throw new Error('Unitree free-root addresses are unavailable');
    return {
      g1: readUnitreeRootState(data.qpos, data.qvel, addresses.g1),
      go2: readUnitreeRootState(data.qpos, data.qvel, addresses.go2),
    };
  };

  const publishDiagnostics = (
    currentState: UnitreeActionState,
    sample: UnitreeActionSample,
    roots: UnitreeRoots,
    safety: { safe: boolean; reason: string | null },
  ) => {
    const initial = initialRootsRef.current;
    if (!initial) return;
    diagnosticsRef.current = {
      programId: currentState.programId,
      phase: sample.phase,
      elapsed: sample.elapsed,
      initial,
      current: roots,
      displacement: {
        g1: computeRootDisplacement(initial.g1, roots.g1),
        go2: computeRootDisplacement(initial.go2, roots.go2),
      },
      clampCount: 'diagnostics' in sample
        ? (sample as ReturnType<typeof sampleUnitreeLocomotionAction>).diagnostics.clampCount
        : 0,
      safe: safety.safe,
      safetyReason: safety.reason,
    };
  };

  useEffect(() => {
    actuatorIdsRef.current = null;
    rootAddressesRef.current = null;
    initialRootsRef.current = null;
    diagnosticsRef.current = null;
    elapsedRef.current = 0;
    lastPhysicsTimeRef.current = 0;
    lastSampleRef.current = sampleUnitreeAction(0);
    processedRequestRef.current = 0;
    lastPublishedElapsedRef.current = 0;
  }, [resetGeneration]);

  useEffect(() => {
    if (requestId === 0 || requestId === processedRequestRef.current || simulation.status !== 'ready') return;
    const model = simulation.mjModelRef.current;
    const data = simulation.mjDataRef.current;
    if (!model || !data) return;
    processedRequestRef.current = requestId;
    try {
      actuatorIdsRef.current = resolveActuators(model);
      rootAddressesRef.current = resolveUnitreeFreeRootAddresses(
        model,
        (name) => findJointByName(model, name),
      );
      initialRootsRef.current = readRoots(data);
      elapsedRef.current = 0;
      lastPhysicsTimeRef.current = data.time;
      lastPublishedElapsedRef.current = 0;
      lastSampleRef.current = stateRef.current.programId === 'locomotion'
        ? sampleUnitreeLocomotionAction(0)
        : sampleUnitreeAction(0);
      const safety = validateUnitreeDynamicsState(initialRootsRef.current);
      publishDiagnostics(stateRef.current, lastSampleRef.current, initialRootsRef.current, safety);
    } catch (error) {
      actuatorIdsRef.current = null;
      rootAddressesRef.current = null;
      initialRootsRef.current = null;
      onStateChangeRef.current(failAction(stateRef.current, error));
    }
  }, [requestId, simulation]);

  useBeforePhysicsStep((_model, data) => {
    const ids = actuatorIdsRef.current;
    const currentState = stateRef.current;
    if (!ids || (currentState.status !== 'running' && currentState.status !== 'paused')) return;

    try {
      if (currentState.status === 'paused') {
        lastPhysicsTimeRef.current = data.time;
        applyUnitreeActionTargets(data.ctrl, ids, lastSampleRef.current);
        return;
      }

      const physicsDelta = Math.max(0, data.time - lastPhysicsTimeRef.current);
      lastPhysicsTimeRef.current = data.time;
      const program = getUnitreeActionProgram(currentState.programId);
      elapsedRef.current = Math.min(
        program.duration,
        elapsedRef.current + physicsDelta,
      );
      const roots = readRoots(data);
      const safety = validateUnitreeDynamicsState(roots);
      if (!safety.safe) throw new Error(safety.reason ?? 'Unitree dynamics safety check failed');
      const sample = currentState.programId === 'locomotion'
        ? validateLocomotionTargets(sampleUnitreeLocomotionAction(elapsedRef.current, {
          g1: roots.g1,
          go2: roots.go2,
        }))
        : sampleUnitreeAction(elapsedRef.current);
      lastSampleRef.current = sample;
      applyUnitreeActionTargets(data.ctrl, ids, sample);
      publishDiagnostics(currentState, sample, roots, safety);

      if (elapsedRef.current >= program.duration) {
        actuatorIdsRef.current = null;
        onStateChangeRef.current(completeAction(currentState));
        return;
      }

      const phaseChanged = sample.phase !== currentState.phase;
      const publishElapsed = elapsedRef.current - lastPublishedElapsedRef.current >= 0.1;
      if (phaseChanged || publishElapsed) {
        lastPublishedElapsedRef.current = elapsedRef.current;
        onStateChangeRef.current({
          programId: currentState.programId,
          status: 'running',
          phase: sample.phase,
          elapsed: elapsedRef.current,
          error: null,
        });
      }
    } catch (error) {
      try {
        applyUnitreeActionTargets(data.ctrl, ids, sampleUnitreeAction(0));
      } catch {
        // The original failure is more actionable than a secondary safe-home write failure.
      }
      actuatorIdsRef.current = null;
      onStateChangeRef.current(failAction(currentState, error));
    }
  });

  return null;
}
