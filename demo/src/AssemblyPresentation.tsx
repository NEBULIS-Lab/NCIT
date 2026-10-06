import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {Environment,Lightformer} from '@react-three/drei';
import {useMujoco} from 'mujoco-react';
import {installAssemblyPresentation} from './assemblyPresentation.js';

export function AssemblyPresentation() {
  const {scene}=useThree();
  const {status,mjModelRef}=useMujoco();
  useEffect(()=>{
    if(status!=='ready'||!mjModelRef.current)return;
    let restore:(()=>void)|undefined;
    // The upstream scene builds its body meshes in a ready-state effect.
    const frame=requestAnimationFrame(()=>{restore=installAssemblyPresentation(scene,mjModelRef.current);});
    return ()=>{cancelAnimationFrame(frame);restore?.();};
  },[scene,status,mjModelRef]);
  return <Environment frames={1} resolution={64}>
    <Lightformer form="rect" intensity={2.5} color="#ffffff" scale={[4,3,1]} position={[0,0,4]} rotation={[Math.PI,0,0]}/>
    <Lightformer form="rect" intensity={1.2} color="#e5e9e8" scale={[3,2,1]} position={[0,3,2]} rotation={[Math.PI/2,0,0]}/>
  </Environment>;
}
