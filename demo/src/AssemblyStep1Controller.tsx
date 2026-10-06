import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import {
  findJointByName,
  findSiteByName,
  useBeforePhysicsStep,
  useMujoco,
} from 'mujoco-react';
import type { MujocoData, MujocoModel } from 'mujoco-react';

import {
  ASSEMBLY1_GRIPPER_OPEN,
  ASSEMBLY1_STEP1_ARMS,
  interpolateJointTargets,
  isCompleteAssemblyStep1Plan,
  selectAssemblyStep1Phase,
  holdAssemblyJointState,
} from './assemblyStep1.js';
import type { AssemblyStep1ArmPlan, AssemblyStep1Status } from './assemblyStep1.js';

interface RuntimeArmPlan extends AssemblyStep1ArmPlan {
  actuatorIndices: number[];
  gripperActuatorIndex: number;
  dofAddresses: number[];
  qposAddresses: number[];
}

interface HeldArmState {
  actuatorIndices: number[];
  dofAddresses: number[];
  qposAddresses: number[];
  positions: number[];
}

interface AssemblyStep1ControllerProps {
  requestId: number;
  resetGeneration: number;
  ownershipRef: MutableRefObject<'manual' | 'step1' | 'step2' | 'step3' | 'step4'>;
  onStatusChange: (status: AssemblyStep1Status) => void;
  onMotionComplete: (model: MujocoModel, data: MujocoData) => void;
}

function solutionIsWithinLimits(model: MujocoModel, jointIds: number[], solution: number[]) {
  return solution.every((value, index) => {
    const jointId = jointIds[index];
    if (!model.jnt_limited[jointId]) return Number.isFinite(value);
    const minimum = model.jnt_range[jointId * 2];
    const maximum = model.jnt_range[jointId * 2 + 1];
    return Number.isFinite(value) && value >= minimum && value <= maximum;
  });
}

function createArmPlan({
  model,
  data,
  arm,
}: {
  model: MujocoModel;
  data: { ctrl: Float64Array };
  arm: (typeof ASSEMBLY1_STEP1_ARMS)[number];
}): RuntimeArmPlan | null {
  const siteId = findSiteByName(model, arm.siteName);
  const jointIds = arm.jointNames.map((name) => findJointByName(model, name));
  if (siteId < 0 || jointIds.some((id) => id < 0)) {
    console.error(`[assembly-step1] ${arm.key} is missing its TCP site or one or more joints`);
    return null;
  }
  if (
    arm.actuatorIndices.some((index) => index < 0 || index >= model.nu)
    || arm.gripperActuatorIndex < 0
    || arm.gripperActuatorIndex >= model.nu
  ) {
    console.error(`[assembly-step1] ${arm.key} actuator block is unavailable`);
    return null;
  }

  const high = [...arm.highJointTargets];
  const final = [...arm.finalJointTargets];
  if (!solutionIsWithinLimits(model, jointIds, high)) {
    console.error(`[assembly-step1] ${arm.key} high waypoint is outside a joint limit`);
    return null;
  }
  if (!solutionIsWithinLimits(model, jointIds, final)) {
    console.error(`[assembly-step1] ${arm.key} final waypoint is outside a joint limit`);
    return null;
  }

  return {
    armKey: arm.key,
    start: arm.actuatorIndices.map((index) => data.ctrl[index]),
    high,
    final,
    actuatorIndices: [...arm.actuatorIndices],
    gripperActuatorIndex: arm.gripperActuatorIndex,
    dofAddresses: jointIds.map((jointId) => model.jnt_dofadr[jointId]),
    qposAddresses: jointIds.map((jointId) => model.jnt_qposadr[jointId]),
  };
}

export function AssemblyStep1Controller({
  requestId,
  resetGeneration,
  ownershipRef,
  onStatusChange,
  onMotionComplete,
}: AssemblyStep1ControllerProps) {
  const simulation = useMujoco();
  const planRef = useRef<RuntimeArmPlan[] | null>(null);
  const postStep1HoldRef = useRef<HeldArmState[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const completedRequestRef = useRef(0);
  const onStatusChangeRef = useRef(onStatusChange);
  const onMotionCompleteRef = useRef(onMotionComplete);
  onStatusChangeRef.current = onStatusChange;
  onMotionCompleteRef.current = onMotionComplete;

  useEffect(() => {
    planRef.current = null;
    postStep1HoldRef.current = [];
    startTimeRef.current = null;
    completedRequestRef.current = requestId;
    if (ownershipRef.current === 'step1') ownershipRef.current = 'manual';
    onStatusChangeRef.current('idle');
  }, [ownershipRef, resetGeneration]);

  useEffect(() => {
    if (requestId <= 0 || requestId <= completedRequestRef.current) return;
    if (simulation.status !== 'ready') return;
    const model = simulation.mjModelRef.current;
    const data = simulation.mjDataRef.current;
    if (!model || !data) return;

    onStatusChangeRef.current('planning');
    const plans = ASSEMBLY1_STEP1_ARMS.map((arm) => createArmPlan({
      model,
      data,
      arm,
    }));
    if (!isCompleteAssemblyStep1Plan(plans)) {
      completedRequestRef.current = requestId;
      planRef.current = null;
      postStep1HoldRef.current = [];
      if (ownershipRef.current === 'step1') ownershipRef.current = 'manual';
      console.error('[assembly-step1] one or more pre-grasp targets are unreachable');
      onStatusChangeRef.current('error');
      return;
    }

    planRef.current = plans as RuntimeArmPlan[];
    postStep1HoldRef.current = [];
    ownershipRef.current = 'step1';
    startTimeRef.current = null;
    completedRequestRef.current = requestId;
    onStatusChangeRef.current('running');
  }, [ownershipRef, requestId, simulation]);

  useBeforePhysicsStep((model, data) => {
    if (ownershipRef.current !== 'step1') return;
    const plans = planRef.current;
    if (!plans) {
      holdAssemblyJointState(data.ctrl, data.qpos, data.qvel, postStep1HoldRef.current);
      return;
    }
    if (startTimeRef.current === null) startTimeRef.current = data.time;
    const elapsed = data.time - startTimeRef.current;
    const { phase, progress } = selectAssemblyStep1Phase(elapsed);

    for (const plan of plans) {
      const controls = phase === 'high'
        ? interpolateJointTargets(plan.start, plan.high, progress)
        : phase === 'final'
          ? interpolateJointTargets(plan.high, plan.final, progress)
          : plan.final;
      for (let joint = 0; joint < plan.actuatorIndices.length; joint += 1) {
        data.ctrl[plan.actuatorIndices[joint]] = controls[joint];
      }
      data.ctrl[plan.gripperActuatorIndex] = ASSEMBLY1_GRIPPER_OPEN;
    }

    if (phase === 'complete') {
      postStep1HoldRef.current = plans
        .filter((plan) => plan.armKey === 'r1' || plan.armKey === 'r3')
        .map((plan) => ({
          actuatorIndices: [...plan.actuatorIndices],
          dofAddresses: [...plan.dofAddresses],
          qposAddresses: [...plan.qposAddresses],
          positions: plan.qposAddresses.map((address) => data.qpos[address]),
        }));
      planRef.current = null;
      startTimeRef.current = null;
      onMotionCompleteRef.current(model, data);
      onStatusChangeRef.current('complete');
    }
  });

  return null;
}
