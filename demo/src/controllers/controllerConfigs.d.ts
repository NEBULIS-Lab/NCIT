import type { ControlTarget } from '../controlTargets.js';
import type { ArmControllerConfig } from './useArmController';

export type GripperBinding = Record<
  string,
  { actuator: string; toggle: [number, number] }
>;

export function getFrankaGripperBinding(
  target: ControlTarget,
  initiallyOpen?: boolean,
): GripperBinding;
export function getIndustrialGripperBinding(target: ControlTarget): GripperBinding;
export function createSO101ControllerConfig(actuatorOffset: number): ArmControllerConfig;
export function createXLeRobotControllerConfig(actuatorOffset: number): ArmControllerConfig;
