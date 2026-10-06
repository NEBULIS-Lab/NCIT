import type {Mesh,Object3D} from 'three';
export function styleAssemblyMesh(mesh:Mesh,geom:string,body:string):()=>void;
export function cleanToolSurface(mesh:Mesh,body:string):()=>void;
export function assemblyStationDecals():{text:string;position:number[];size:number[]}[];
export function createConnectorSurface():Mesh;
export function installAssemblyPresentation(scene:Object3D,model:unknown):()=>void;
