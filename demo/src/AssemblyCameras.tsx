import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useMujoco} from 'mujoco-react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {STLLoader} from 'three/examples/jsm/loaders/STLLoader.js';
import {createAssemblyCameraRig,withCameraOverlaysHidden} from './assemblyCameras.js';
import type {CameraTiles} from './AssemblyCameraPanel';

const asset=(name:string)=>`${import.meta.env.BASE_URL}assets/assembly-cameras/${name}`;
type Rig=ReturnType<typeof createAssemblyCameraRig>;
export function AssemblyCameras({tiles,onStatus}:{tiles:CameraTiles;onStatus:(status:string)=>void}){
  const {scene,gl,camera}=useThree();
  const {status,mjModelRef}=useMujoco();
  const runtime=useRef<{rig:Rig;targets:Map<string,THREE.WebGLRenderTarget>;screen:THREE.Scene;quad:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;ortho:THREE.OrthographicCamera;last:number}|null>(null);
  useEffect(()=>{
    if(status!=='ready'||!mjModelRef.current)return;
    let cancelled=false,dispose:(()=>void)|undefined;
    onStatus('loading');
    const model=mjModelRef.current;
    const name=(id:number)=>{let result='';for(let p=model.name_bodyadr[id];model.names[p];p++)result+=String.fromCharCode(model.names[p]);return result;};
    Promise.all([
      new GLTFLoader().loadAsync(asset('d435.glb')),
      ...['panda-d435-mount.stl','extrusion_1000.stl','overhead_mount.stl','corner_bracket.stl'].map(file=>new STLLoader().loadAsync(asset(file))),
    ]).then(([gltf,mount,mast,head,corner])=>{
      const rig=createAssemblyCameraRig();
      const materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[];
      const source=(gltf as Awaited<ReturnType<GLTFLoader['loadAsync']>>).scene;
      source.traverse(object=>{if(object instanceof THREE.Mesh){geometries.push(object.geometry);materials.push(...(Array.isArray(object.material)?object.material:[object.material]));}});
      geometries.push(mount as THREE.BufferGeometry,mast as THREE.BufferGeometry,head as THREE.BufferGeometry,corner as THREE.BufferGeometry);
      const black=new THREE.MeshStandardMaterial({color:'#353c3b',metalness:.08,roughness:.75});materials.push(black);
      const root=new THREE.Group();root.name='assembly-camera-hardware';root.add(rig.global);
      const makeMesh=(geometry:THREE.BufferGeometry,parent:THREE.Object3D)=>{
        const mesh=new THREE.Mesh(geometry,black);mesh.castShadow=true;mesh.receiveShadow=true;mesh.raycast=()=>{};parent.add(mesh);return mesh;
      };
      for(const housing of [rig.global,...rig.wrists.map((w:THREE.Group)=>w.children[0])]){
        const mesh=source.clone(true);mesh.name='realsense-d435-source-model';mesh.traverse(o=>{o.raycast=()=>{};if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});housing.add(mesh);
      }
      for(const wrist of rig.wrists)makeMesh(mount as THREE.BufferGeometry,wrist);
      // A fixed side mast, reusing ALOHA's slotted extrusion and bracket meshes.
      const pole=makeMesh(mast as THREE.BufferGeometry,root);pole.position.set(.90,1.34,1.60);pole.scale.z=1.58;
      const foot=makeMesh(mast as THREE.BufferGeometry,root);foot.scale.z=.28;foot.rotation.y=Math.PI/2;foot.position.set(1.04,1.34,.012);
      const bracket=makeMesh(corner as THREE.BufferGeometry,root);bracket.position.set(.90,1.34,.025);
      const adapter=makeMesh(head as THREE.BufferGeometry,root);adapter.position.set(.90,1.34,1.60);
      adapter.rotation.z=Math.atan2(-.9,1.3);
      const releaseAssets=()=>{for(const geometry of new Set(geometries))geometry.dispose();for(const material of new Set(materials))material.dispose();};
      if(cancelled){releaseAssets();return;}
      const groups=new Map<string,THREE.Object3D>();
      scene.traverse(o=>{if(o instanceof THREE.Group&&Number.isInteger(o.userData.bodyID))groups.set(name(o.userData.bodyID),o);});
      const parents=rig.wrists.map((_:THREE.Group,i:number)=>groups.get(`r${i}_hand`));
      if(parents.some((p:THREE.Object3D|undefined)=>!p)){releaseAssets();throw new Error('Wrist camera attachment body missing');}
      const targets=new Map<string,THREE.WebGLRenderTarget>(rig.views.map((v:{key:string})=>{
        const target=new THREE.WebGLRenderTarget(384,216);target.texture.colorSpace=THREE.SRGBColorSpace;return [v.key,target];
      }));
      const screen=new THREE.Scene(),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({toneMapped:false,depthTest:false,depthWrite:false}));screen.add(quad);
      const ortho=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
      const running={rig,targets,screen,quad,ortho,last:-Infinity};
      dispose=()=>{
        if(runtime.current===running)runtime.current=null;
        root.removeFromParent();rig.wrists.forEach((w:THREE.Group)=>w.removeFromParent());
        for(const target of targets.values())target.dispose();quad.geometry.dispose();quad.material.dispose();
        releaseAssets();
      };
      if(cancelled){dispose();return;}
      scene.add(root);parents.forEach((p:THREE.Object3D|undefined,i:number)=>p!.add(rig.wrists[i]));
      runtime.current=running;onStatus('ready');
    }).catch(error=>{if(!cancelled)onStatus(`Camera unavailable: ${error.message}`);});
    return ()=>{cancelled=true;dispose?.();};
  },[scene,status,mjModelRef,onStatus]);

  // Take over rendering only, never physics. Reuse one WebGL context; preview
  // textures are refreshed at 10 Hz and composited after the normal main view.
  useFrame(({clock})=>{
    const previousTarget=gl.getRenderTarget(),viewport=gl.getViewport(new THREE.Vector4()),scissor=gl.getScissor(new THREE.Vector4());
    const scissorTest=gl.getScissorTest(),autoClear=gl.autoClear,shadowUpdate=gl.shadowMap.autoUpdate;
    try{
      gl.setRenderTarget(null);gl.setScissorTest(false);gl.autoClear=true;gl.render(scene,camera);
      const r=runtime.current;if(!r||tiles.current.size===0)return;
      const refresh=clock.elapsedTime-r.last>=.1;
      gl.shadowMap.autoUpdate=false;
      if(refresh){
        scene.updateMatrixWorld(true);
        withCameraOverlaysHidden(scene,()=>{
          for(const view of r.rig.views)if(tiles.current.has(view.key)){
            gl.setRenderTarget(r.targets.get(view.key)!);gl.setScissorTest(false);gl.render(scene,view.camera);
          }
        });
        r.last=clock.elapsedTime;
      }
      gl.setRenderTarget(null);gl.autoClear=false;gl.setScissorTest(true);
      const canvas=gl.domElement.getBoundingClientRect();
      for(const [key,element] of tiles.current){
        const rect=element.getBoundingClientRect();if(!rect.width||!rect.height)continue;
        const x=rect.left-canvas.left,y=canvas.bottom-rect.bottom;
        gl.setViewport(x,y,rect.width,rect.height);gl.setScissor(x,y,rect.width,rect.height);
        r.quad.material.map=r.targets.get(key)!.texture;gl.render(r.screen,r.ortho);
      }
    }finally{
      gl.setRenderTarget(previousTarget);gl.setViewport(viewport);gl.setScissor(scissor);gl.setScissorTest(scissorTest);gl.autoClear=autoClear;gl.shadowMap.autoUpdate=shadowUpdate;
    }
  },1);
  return null;
}
