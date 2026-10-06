import { useEffect, useRef } from 'react';
import { findJointByName, useAfterPhysicsStep, useMujoco } from 'mujoco-react';

import type { ControlTarget } from '../controlTargets.js';
import { computePlanarVelocity } from './planarMobility.js';

export function PlanarMobileController({ target }: { target: ControlTarget }) {
  const simulation = useMujoco();
  const keys = useRef<Record<string, boolean>>({});
  const mobility = target.mobility;
  if (!mobility) throw new Error(`Control target ${target.key} has no mobility definition`);

  useEffect(() => {
    document.documentElement.dataset.mobileController = target.key;
    const onDown = (event: KeyboardEvent) => { keys.current[event.code] = true; };
    const onUp = (event: KeyboardEvent) => { keys.current[event.code] = false; };
    const onBlur = () => { keys.current = {}; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
      delete document.documentElement.dataset.mobileController;
      const data = simulation.mjDataRef?.current;
      if (data) mobility.actuatorIndices.forEach((index) => { data.ctrl[index] = 0; });
    };
  }, [mobility, simulation]);

  // Run after the scene-level home controller so mobile velocity targets are not
  // overwritten by the generic homeJoints application in the same physics tick.
  useAfterPhysicsStep((model, data) => {
    const yawJointId = findJointByName(model, mobility.yawJoint);
    if (yawJointId < 0) {
      document.documentElement.dataset.mobileControllerStatus = 'missing-yaw-joint';
      return;
    }

    const forward = Number(Boolean(keys.current.KeyW)) - Number(Boolean(keys.current.KeyS));
    const turn = Number(Boolean(keys.current.KeyA)) - Number(Boolean(keys.current.KeyD));
    const relativeYaw = data.qpos[model.jnt_qposadr[yawJointId]];
    const initialYaw = mobility.initialYawDegrees * Math.PI / 180;
    const controls = computePlanarVelocity({
      forward,
      turn,
      yaw: initialYaw + relativeYaw,
      linearSpeed: mobility.linearSpeed,
      turnSpeed: mobility.turnSpeed,
    });

    mobility.actuatorIndices.forEach((actuatorIndex, index) => {
      data.ctrl[actuatorIndex] = controls[index];
    });
    document.documentElement.dataset.mobileControllerStatus = forward || turn ? 'active' : 'idle';
  });

  return null;
}
