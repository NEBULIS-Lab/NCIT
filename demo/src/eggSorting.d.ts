import type {EggPhase,EggObservation} from './eggTransfer.js';
export function isSortingTrayLoadBearing(observation:EggObservation):boolean;
export function checkSortingGate(gate:EggPhase['gate'],observation:EggObservation):string|null;
export interface SortingTask {arm:number;classIndex:number;eggIndex:number;cellIndex:number;cell:number[];start:number;phases:Omit<EggPhase,'joints'>[]}
export interface SortingPlan {schemaVersion:1;program:'sorting';success:true;initialJoints:number[];initialEggPositions:number[][];tasks:SortingTask[];duration:number;counts:number[]}
export interface SortingEvent {time:number;taskIndex:number;stage:number}
export interface SortingState {phase:'loading'|'ready'|'running'|'complete'|'error';label:string;counts:number[];arms:string[];reason?:string;failureSource?:'asset'|'runtime'}
export function sortingLocksControls(state:Pick<SortingState,'phase'|'failureSource'>):boolean;
export function reserveBatch(pending:number[],conflicts:number[][]):{running:number[];waiting:number[]};
export function sourcePathsConflict(a:Pick<SortingTask,'arm'|'eggIndex'>,b:Pick<SortingTask,'arm'|'eggIndex'>):boolean;
export function sourceLeaseEnd(task:SortingTask):number;
export function sourceReservationsValid(tasks:SortingTask[]):boolean;
export function isValidSortingPlan(value:unknown):value is SortingPlan;
export function sampleSortingTask(task:SortingTask,time:number):{joints:number[];gripper:number;stage:number}|null;
export function sortingStageAt(task:SortingTask,time:number):number;
export function sortingEvents(plan:Pick<SortingPlan,'tasks'>):SortingEvent[];
