import type { SceneObject, XmlPatch } from 'mujoco-react';

export interface SceneLayout {
  instanceCount: number;
  yawStepDegrees: number;
  homeJoints: number[];
  xmlPatches: XmlPatch[];
  sceneObjects: SceneObject[];
  camera: { position: [number, number, number]; fov: number };
  orbitTarget: [number, number, number];
  ringRadius?: number;
  spacing?: number;
  workSurfaceHeight?: number;
  armBaseHeight?: number;
  tableTopHeight?: number;
  chassisCollisionTop?: number;
  tableObjects?: SceneObject[];
  primaryTcpSite?: string;
  primaryGripperActuator?: string;
  taskStations?: Record<string, [number, number, number]>;
}

export function repeatPose(pose: number[], count: number): number[];
export function fixedBox(
  name: string,
  size: [number, number, number],
  position: [number, number, number],
  rgba: [number, number, number, number],
): SceneObject;

export const FRANKA_HOME: number[];

export const FRANKA_LAYOUT: SceneLayout & {
  ringRadius: number;
  primaryTcpSite: string;
  primaryGripperActuator: string;
};

export const FRANKA_ASSEMBLY_LAYOUT: SceneLayout & {
  ringRadius: number;
  workSurfaceHeight: number;
  primaryTcpSite: string;
  primaryGripperActuator: string;
  taskStations: {
    frame: [number, number, number];
    parts: [number, number, number];
    poweredTool: [number, number, number];
    manualTool: [number, number, number];
    fasteners: [number, number, number];
    handover: [number, number, number];
  };
};

export const SO101_LAYOUT: SceneLayout & {
  ringRadius: number;
  workSurfaceHeight: number;
  primaryTcpSite: string;
};

export const XLEROBOT_LAYOUT: SceneLayout & {
  spacing: number;
  armBaseHeight: number;
  tableTopHeight: number;
  chassisCollisionTop: number;
  tableObjects: SceneObject[];
};
