import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  findJointByName,
  findSiteByName,
  useBeforePhysicsStep,
  useMujoco,
  useMujocoWasm,
} from 'mujoco-react';
import type { IkContextValue } from 'mujoco-react';

import type { ControlTarget } from '../controlTargets.js';
import { solveSelectedIk } from './selectedIkSolver.js';

const rotationMatrix = new THREE.Matrix4();

function syncTargetToSite(
  data: NonNullable<ReturnType<typeof useMujoco>['mjDataRef']>['current'],
  siteId: number,
  target: THREE.Group,
) {
  if (!data || siteId < 0) return;
  const positionOffset = siteId * 3;
  const rotationOffset = siteId * 9;
  target.position.set(
    data.site_xpos[positionOffset],
    data.site_xpos[positionOffset + 1],
    data.site_xpos[positionOffset + 2],
  );
  rotationMatrix.set(
    data.site_xmat[rotationOffset], data.site_xmat[rotationOffset + 1], data.site_xmat[rotationOffset + 2], 0,
    data.site_xmat[rotationOffset + 3], data.site_xmat[rotationOffset + 4], data.site_xmat[rotationOffset + 5], 0,
    data.site_xmat[rotationOffset + 6], data.site_xmat[rotationOffset + 7], data.site_xmat[rotationOffset + 8], 0,
    0, 0, 0, 1,
  );
  target.quaternion.setFromRotationMatrix(rotationMatrix);
}

export interface SelectedIkControllerResult {
  controller: IkContextValue | null;
  resolvedSiteName: string | null;
}

export function useSelectedIkController(
  target: ControlTarget,
  resetGeneration: number,
  automationActive = false,
): SelectedIkControllerResult {
  const simulation = useMujoco();
  const { mujoco } = useMujocoWasm();
  const ikEnabledRef = useRef(false);
  const ikCalculatingRef = useRef(false);
  const ikTargetRef = useRef(new THREE.Group());
  const siteIdRef = useRef(-1);
  const qposAddressesRef = useRef<number[]>([]);
  const actuatorIndicesRef = useRef<number[]>([]);
  const [resolvedSiteName, setResolvedSiteName] = useState<string | null>(null);

  const syncTargetToSiteApi = useCallback(() => {
    if (simulation.status !== 'ready') return;
    syncTargetToSite(simulation.mjDataRef.current, siteIdRef.current, ikTargetRef.current);
  }, [simulation]);

  useEffect(() => {
    ikEnabledRef.current = false;
    ikCalculatingRef.current = false;
    siteIdRef.current = -1;
    qposAddressesRef.current = [];
    actuatorIndicesRef.current = [];
    setResolvedSiteName(null);

    if (simulation.status !== 'ready' || !target.ik) return;
    const model = simulation.mjModelRef.current;
    const data = simulation.mjDataRef.current;
    if (!model || !data) return;

    const siteId = findSiteByName(model, target.ik.siteName);
    const qposAddresses = target.ik.jointNames.map((jointName) => {
      const jointId = findJointByName(model, jointName);
      return jointId < 0 ? -1 : model.jnt_qposadr[jointId];
    });
    if (siteId < 0 || qposAddresses.some((address) => address < 0)) {
      console.error(`[control] could not resolve IK resources for ${target.key}`);
      return;
    }

    siteIdRef.current = siteId;
    qposAddressesRef.current = qposAddresses;
    actuatorIndicesRef.current = [...target.ik.actuatorIndices];
    syncTargetToSite(data, siteId, ikTargetRef.current);
    setResolvedSiteName(target.ik.siteName);
  }, [simulation.status, simulation.mjModelRef, simulation.mjDataRef, target]);

  useEffect(() => {
    ikEnabledRef.current = false;
    ikCalculatingRef.current = false;
    syncTargetToSiteApi();
  }, [resetGeneration, syncTargetToSiteApi]);

  useEffect(() => {
    if (!automationActive) return;
    ikEnabledRef.current = false;
    ikCalculatingRef.current = false;
  }, [automationActive]);

  useBeforePhysicsStep((model, data) => {
    if (
      automationActive
      ||
      !mujoco ||
      !target.ik ||
      !ikEnabledRef.current ||
      siteIdRef.current < 0 ||
      qposAddressesRef.current.length === 0
    ) {
      ikCalculatingRef.current = false;
      return;
    }

    ikCalculatingRef.current = true;
    const currentQ = qposAddressesRef.current.map((address) => data.qpos[address]);
    const solution = solveSelectedIk({
      mujoco,
      model,
      data,
      siteId: siteIdRef.current,
      qposAddresses: qposAddressesRef.current,
      currentQ,
      targetPosition: ikTargetRef.current.position,
      targetQuaternion: ikTargetRef.current.quaternion,
    });
    if (!solution) return;
    for (let index = 0; index < solution.length; index += 1) {
      data.ctrl[actuatorIndicesRef.current[index]] = solution[index];
    }
  });

  const setIkEnabled = useCallback((enabled: boolean) => {
    ikEnabledRef.current = enabled;
    if (enabled) syncTargetToSiteApi();
  }, [syncTargetToSiteApi]);

  const moveTarget = useCallback((position: THREE.Vector3) => {
    ikTargetRef.current.position.copy(position);
    ikEnabledRef.current = true;
  }, []);

  const solveIK = useCallback((
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    currentQ: number[],
  ) => {
    if (simulation.status !== 'ready' || !mujoco || siteIdRef.current < 0) return null;
    const model = simulation.mjModelRef.current;
    const data = simulation.mjDataRef.current;
    if (!model || !data) return null;
    return solveSelectedIk({
      mujoco,
      model,
      data,
      siteId: siteIdRef.current,
      qposAddresses: qposAddressesRef.current,
      currentQ,
      targetPosition: position,
      targetQuaternion: quaternion,
    });
  }, [mujoco, simulation]);

  const getGizmoStats = useCallback(() => {
    if (!ikCalculatingRef.current) return null;
    return {
      pos: ikTargetRef.current.position.clone(),
      rot: new THREE.Euler().setFromQuaternion(ikTargetRef.current.quaternion),
    };
  }, []);

  const controller = useMemo<IkContextValue | null>(() => {
    if (!target.ik) return null;
    return {
      ikEnabledRef,
      ikCalculatingRef,
      ikTargetRef,
      siteIdRef,
      setIkEnabled,
      moveTarget,
      syncTargetToSite: syncTargetToSiteApi,
      solveIK,
      getGizmoStats,
    };
  }, [target.ik, setIkEnabled, moveTarget, syncTargetToSiteApi, solveIK, getGizmoStats]);

  return { controller, resolvedSiteName };
}
