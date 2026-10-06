import { useMemo } from 'react';
import { useArmController } from './useArmController';
import type { IkContextValue } from 'mujoco-react';
import type { ControlTarget } from '../controlTargets.js';
import { createXLeRobotControllerConfig } from './controllerConfigs.js';

export function XLeRobotController({
  target,
  ik,
}: {
  target: ControlTarget;
  ik?: IkContextValue | null;
}) {
  const config = useMemo(
    () => createXLeRobotControllerConfig(target.actuatorOffset),
    [target.actuatorOffset],
  );
  useArmController(config, ik);
  return null;
}
