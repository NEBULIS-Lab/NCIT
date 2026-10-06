import type { SceneLayout } from './sceneLayouts.js';

export interface AlternateAssemblyLayout extends SceneLayout {
  ringRadius: number;
  workSurfaceHeight: number;
  primaryTcpSite: string;
  primaryGripperActuator: string;
  taskStations: Record<string, [number, number, number]>;
}

export const PIPER_HOME: number[];
export const UR5E_HOME: number[];
export const PIPER_ASSEMBLY1_LAYOUT: AlternateAssemblyLayout;
export const UR5E_ASSEMBLY1_LAYOUT: AlternateAssemblyLayout;
