import type { ThreeElements } from '@react-three/fiber';
import type { AssemblyStep2RuntimeDiagnostics } from './assemblyStep2.js';
import type { AssemblyStep3RuntimeDiagnostics } from './assemblyStep3.js';
import type { AssemblyStep4RuntimeDiagnostics } from './assemblyStep4.js';
import type { UnitreeActionState } from './unitreeActionState.js';
import type { UnitreeActionProgramId } from './unitreeActionSequence.js';
import type { UnitreeRuntimeDiagnostics } from './unitreeDynamicsAdapter.js';

declare global {
  interface Window {
    robotDemo?: {
      getCtrl(): number[];
      setInspectionCamera(position: [number,number,number], target: [number,number,number]): void;
      getPhysicsDiagnostics(): {contacts:number;constraints:number;arenaBytes:number;peakArenaBytes:number;warnings:Array<{index:number;count:number;lastInfo:number}>};
      getQpos(): number[];
      getQvel(): number[];
      getBodyPositions(names: string[]): Record<string, [number, number, number]>;
      getSitePositions(names: string[]): Record<string, [number, number, number]>;
      getSiteOrientations(names: string[]): Record<string, number[]>;
      getBodyOrientations(names: string[]): Record<string, [number, number, number, number]>;
      getJointPositions(names: string[]): Record<string, number>;
      getContacts(): Array<{
        geom1: number;
        geom2: number;
        geomName1: string;
        geomName2: string;
        distance: number;
        body1: string;
        body2: string;
      }>;
      reset(): void;
      moveIkTargetBy(x: number, y: number, z: number): boolean;
      runAssemblyStep1(): boolean;
      runAssemblyStep2(): boolean;
      runAssemblyStep3(): boolean;
      runAssemblyStep4(): boolean;
      getAssemblyStep2Diagnostics(): AssemblyStep2RuntimeDiagnostics | null;
      getAssemblyStep3Diagnostics(): AssemblyStep3RuntimeDiagnostics | null;
      getAssemblyStep4Diagnostics(): AssemblyStep4RuntimeDiagnostics | null;
      runUnitreeAction(): boolean;
      pauseUnitreeAction(): boolean;
      resumeUnitreeAction(): boolean;
      selectUnitreeActionProgram(programId: UnitreeActionProgramId): boolean;
      getUnitreeActionState(): UnitreeActionState;
      getUnitreeActionDiagnostics(): UnitreeRuntimeDiagnostics | null;
    };
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
