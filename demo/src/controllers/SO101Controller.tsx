import { useMemo } from 'react';
import { useArmController } from './useArmController';
import type { IkContextValue } from 'mujoco-react';
import type { ControlTarget } from '../controlTargets.js';
import { createSO101ControllerConfig } from './controllerConfigs.js';

export function SO101Controller({
  target,
  ik,
}: {
  target: ControlTarget;
  ik?: IkContextValue | null;
}) {
  const config = useMemo(
    () => createSO101ControllerConfig(target.actuatorOffset),
    [target.actuatorOffset],
  );
  useArmController(config, ik);
  return null;
}
