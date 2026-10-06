import type { SceneLayout } from './sceneLayouts.js';

type Point = [number, number, number];

export interface FrankaAssemblyLayout extends SceneLayout {
  ringRadius: number;
  workSurfaceHeight: number;
  primaryTcpSite: string;
  primaryGripperActuator: string;
  taskStations: {
    frame: Point;
    parts: Point;
    poweredTool: Point;
    manualTool: Point;
    hammer: Point;
    fasteners: Point;
    handover: Point;
  };
}

export const FRANKA_ASSEMBLY_INTERFACE: {
  crossMemberTargetPose: Point;
  frameReceiverPositions: Point[];
  crossMemberHoleLocalPositions: Point[];
};

export function applyAssemblyTargetPose(points: Point[], targetPose: Point): Point[];

export const FRANKA_ASSEMBLY1_LAYOUT: FrankaAssemblyLayout;
export const FRANKA_ASSEMBLY2_LAYOUT: FrankaAssemblyLayout;
