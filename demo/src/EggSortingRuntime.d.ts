import type {MujocoData,MujocoModel} from 'mujoco-react';
import type {SortingPlan,SortingState} from './eggSorting.js';
import type {EggObservation} from './eggTransfer.js';
export class EggSortingRuntime {
  constructor(plan:SortingPlan,find:{body:(name:string)=>number;joint:(name:string)=>number;site:(name:string)=>number});
  state:SortingState;time:number;history:unknown[];observations:EggObservation[];
  metrics:{maxForbiddenPenetration:number;maxGripPenetration:number;maxNeighborDisplacement:number;parallelSeconds:number;maxSimultaneousArms:number};
  reset():void;start(m:MujocoModel,d:MujocoData):void;step(m:MujocoModel,d:MujocoData):void;
}
