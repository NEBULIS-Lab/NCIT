import { repeatPose } from './sceneLayouts.js';

// Isolated MJCF package. No Assembly patches, high-force settings or controllers.
export const EGG_SORTING_LAYOUT = {
  instanceCount: 4,
  yawStepDegrees: 90,
  ringRadius: .78,
  workSurfaceHeight: .1,
  homeJoints: repeatPose([1.570796, -.785398, 0, -2.356194, 0, 1.570796, .785398, 255], 4),
  xmlPatches: [],
  sceneObjects: [],
  camera: { position: [2.25, -2.25, 2.75], fov: 42 },
  orbitTarget: [0, 0, .25],
};
