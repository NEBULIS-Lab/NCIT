import type {Group,PerspectiveCamera,Object3D} from 'three';
export const CAMERA_KEYS:string[];
export const CAMERA_LABELS:string[];
export const ASSEMBLY_CAMERA_PATCHES:{target:string;injectAfter:string;inject:string}[];
export function selectedCameraViews(selection:string):string[];
export function withCameraOverlaysHidden<T>(scene:Object3D,render:()=>T):T;
export function createAssemblyCameraRig():{
  global:Group;
  wrists:Group[];
  views:{key:string;label:string;camera:PerspectiveCamera}[];
};
