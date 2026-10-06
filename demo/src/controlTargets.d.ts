export interface IkTargetDefinition {
  siteName: string;
  jointNames: string[];
  actuatorIndices: number[];
}

export interface PlanarMobilityDefinition {
  actuatorIndices: [number, number, number];
  yawJoint: string;
  initialYawDegrees: number;
  linearSpeed: number;
  turnSpeed: number;
}

export interface GripperControlDefinition {
  actuator: string;
  openValue: number;
  closedValue: number;
}

export interface ControlTarget {
  key: string;
  label: string;
  prefix: string;
  actuatorOffset: number;
  gripperActuator?: string;
  gripperControl?: GripperControlDefinition;
  ik?: IkTargetDefinition;
  controlMode?: 'arm' | 'planar-mobile' | 'action-sequence';
  mobility?: PlanarMobilityDefinition;
}

export function shiftIndices(indices: number[], offset: number): number[];
export function createFrankaTargets(): ControlTarget[];
export function createPiperTargets(): ControlTarget[];
export function createUR5eTargets(): ControlTarget[];
export function createSO101Targets(): ControlTarget[];
export function createSO101HomeLabTargets(): ControlTarget[];
export function createXLeRobotTargets(): ControlTarget[];
export function createUnitreeActionTargets(): ControlTarget[];
