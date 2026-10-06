import type { Quaternion, Vector3 } from 'three';
import type { MujocoData, MujocoModel, MujocoModule } from 'mujoco-react';

export interface SelectedIkInput {
  mujoco: MujocoModule;
  model: MujocoModel;
  data: MujocoData;
  siteId: number;
  qposAddresses: number[];
  currentQ: number[];
  targetPosition: Vector3;
  targetQuaternion: Quaternion;
  maxIterations?: number;
  damping?: number;
  tolerance?: number;
  epsilon?: number;
  positionWeight?: number;
  rotationWeight?: number;
  jointRanges?: readonly (readonly [number, number])[];
}

export function solveSelectedIk(input: SelectedIkInput): number[] | null;
export function fitJointAngleToRange(
  value: number,
  minimum: number,
  maximum: number,
): number;
