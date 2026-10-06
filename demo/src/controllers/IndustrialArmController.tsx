import { useKeyboardTeleop } from 'mujoco-react';

import type { ControlTarget } from '../controlTargets.js';
import { getIndustrialGripperBinding } from './controllerConfigs.js';

/** Selected industrial arm gripper toggle; IK is supplied by SceneChildren. */
export function IndustrialArmController({
  target,
  enabled = true,
}: {
  target: ControlTarget;
  enabled?: boolean;
}) {
  useKeyboardTeleop({
    bindings: getIndustrialGripperBinding(target),
    enabled,
  });
  return null;
}
