export interface PlanarVelocityInput {
  forward: number;
  turn: number;
  yaw: number;
  linearSpeed: number;
  turnSpeed: number;
}

export function computePlanarVelocity(input: PlanarVelocityInput): [number, number, number];
