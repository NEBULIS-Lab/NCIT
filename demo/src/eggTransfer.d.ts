export interface EggPhase { name:string; duration:number; joints:number[]; path:number[][]; gripper:number; gate:'bilateral'|'carried'|'supported'|'released'|'seated'|'tilted'|null }
export interface EggObservation {
  bilateral:boolean; fingerContacts:number; aperture:number; tcpDistance:number; lift:number; traySupported:boolean;
  tiltDegrees:number; cellError:number; speed:number; forbiddenPenetration:number; gripPenetration:number; neighborDisplacement:number;
}
export interface EggMotionPlan {
  schemaVersion:number; success:boolean; egg:string; arm:number; initialJoints:number[]; initialGripper:number;
  cell:number[]; phases:EggPhase[]; initialEggPosition:number[]; initialEggPositions:number[][];
  program?:'reseat'; inspection?:{phaseIndex:number;position:number[];quaternion:number[];tiltDegrees:number};
}
export interface EggTransferState {
  phase:'idle'|'loading'|'ready'|'running'|'complete'|'error';
  label:string; phaseIndex:number; reason?:string;
}
export function sampleEggPhase(phase:Pick<EggPhase,'path'|'gripper'>,progress:number,startGripper:number):{joints:number[];gripper:number};
export function checkEggGate(gate:EggPhase['gate'],observation:EggObservation):string|null;
export function isValidEggPlan(value:unknown):value is EggMotionPlan;
export function didEggClockReset(previous:number|null,current:number):boolean;
export function isEggInspectionMatch(expected:{position:number[];quaternion:number[]},position:number[],quaternion:number[]):boolean;
export function isForbiddenEggContact(a:number,b:number,context:{robotBodies:Set<number>;fingers:number[];egg:number;allowedSupports:Set<number>}):boolean;
