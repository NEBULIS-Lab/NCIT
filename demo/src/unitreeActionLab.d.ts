export const G1_HOME: number[];
export const GO2_HOME: number[];

export interface UnitreeActionLabLayout {
  instanceCount: 2;
  homeJoints: number[];
  xmlPatches: [];
  sceneObjects: [];
  dynamicRoots: ['g1_pelvis', 'go2_base'];
  camera: { position: [number, number, number]; fov: number };
  orbitTarget: [number, number, number];
}

export const UNITREE_ACTION_LAB_LAYOUT: UnitreeActionLabLayout;
