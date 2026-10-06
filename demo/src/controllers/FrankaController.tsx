import { useKeyboardTeleop } from 'mujoco-react';

import type { ControlTarget } from '../controlTargets.js';
import { getFrankaGripperBinding } from './controllerConfigs.js';

/** Franka gripper toggle — V key opens/closes the gripper. */
export function FrankaController({
  target,
  enabled = true,
  initiallyOpen = false,
}: {
  target: ControlTarget;
  enabled?: boolean;
  initiallyOpen?: boolean;
}) {
  useKeyboardTeleop({
    bindings: getFrankaGripperBinding(target, initiallyOpen),
    enabled,
  });
  return null;
}
