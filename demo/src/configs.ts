import type { SceneConfig } from 'mujoco-react';
import { FRANKA_ASSEMBLY1_LAYOUT } from './frankaAssemblyLayouts.js';
import { ASSEMBLY_CAMERA_PATCHES } from './assemblyCameras.js';
import { createFrankaTargets } from './controlTargets.js';
import type { ControlTarget } from './controlTargets.js';
export interface RobotEntry {
  label: string;
  controlFamily: 'franka' | 'industrialArm' | 'so101' | 'xlerobot' | 'unitreeAction';
  config: SceneConfig;
  camera: {position: [number,number,number]; fov: number};
  orbitTarget: [number,number,number];
  gizmoScale?: number; gridSize?: number; gridDivisions?: number;
  controlTargets: ControlTarget[];
}
export const robots: Record<string, RobotEntry> = {
  frankaDemo1: {
    label: 'NCIT · Demo1', controlFamily: 'franka',
    config: {
      src: `${import.meta.env.BASE_URL}assets/franka-assembly2/`, sceneFile: 'scene.xml',
      homeJoints: FRANKA_ASSEMBLY1_LAYOUT.homeJoints,
      xmlPatches: [...FRANKA_ASSEMBLY1_LAYOUT.xmlPatches,...ASSEMBLY_CAMERA_PATCHES],
      sceneObjects: FRANKA_ASSEMBLY1_LAYOUT.sceneObjects,
    },
    camera: FRANKA_ASSEMBLY1_LAYOUT.camera,
    orbitTarget: FRANKA_ASSEMBLY1_LAYOUT.orbitTarget,
    controlTargets: createFrankaTargets(),
  },
};
