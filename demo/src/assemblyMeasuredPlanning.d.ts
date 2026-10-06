import type { MujocoData, MujocoModel, MujocoModule } from 'mujoco-react';
import type { Vector3 } from 'three';
import type { AssemblyStep4ArmPlan, AssemblyStep4Phase } from './assemblyStep4.js';
export function actualInsertionGeometry(model:MujocoModel,data:MujocoData):{hole:Vector3;axis:Vector3;depth:number;radial:number;tilt:number};
export function planMeasuredAssemblyPhase(mujoco:MujocoModule,model:MujocoModel,data:MujocoData,phase:AssemblyStep4Phase,plans:AssemblyStep4ArmPlan[]):void;
