export const G1_HOME = [
  0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0,
  0, 0, 0,
  0.2, 0.2, 0, 1.28, 0, 0, 0,
  0.2, -0.2, 0, 1.28, 0, 0, 0,
];

export const GO2_HOME = [
  0.1, 0.8, -1.5,
  -0.1, 0.8, -1.5,
  0.1, 0.8, -1.5,
  -0.1, 0.8, -1.5,
  0, 0, 0, 1.6, 0, -1.6,
];

export const UNITREE_ACTION_LAB_LAYOUT = {
  instanceCount: 2,
  homeJoints: [...G1_HOME, ...GO2_HOME],
  xmlPatches: [],
  sceneObjects: [],
  dynamicRoots: ['g1_pelvis', 'go2_base'],
  camera: { position: [3.1, -3.8, 2.1], fov: 45 },
  orbitTarget: [0, 0, 0.75],
};
