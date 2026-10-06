import {useEffect,useRef} from 'react';
import {findBodyByName,findJointByName,findSiteByName,useBeforePhysicsStep} from 'mujoco-react';
import {EggSortingRuntime} from './EggSortingRuntime.js';
import {isValidSortingPlan} from './eggSorting.js';
import type {SortingPlan,SortingState} from './eggSorting.js';

declare global {interface Window {eggSorting?:{state:SortingState;time:number;history:unknown[];metrics:EggSortingRuntime['metrics'];observations:EggSortingRuntime['observations']}}}

export function EggSortingController({requestId,resetGeneration,onStateChange}:{requestId:number;resetGeneration:number;onStateChange:(s:SortingState)=>void}) {
  const plan=useRef<SortingPlan|null>(null),runtime=useRef<EggSortingRuntime|null>(null),lastRequest=useRef(requestId);
  const callback=useRef(onStateChange);callback.current=onStateChange;
  const lastState=useRef<SortingState|null>(null);
  function publish() {
    const r=runtime.current;if(!r)return;
    window.eggSorting={state:r.state,time:r.time,history:r.history,metrics:r.metrics,observations:r.observations};
    if(r.state!==lastState.current){lastState.current=r.state;callback.current(r.state);}
  }
  useEffect(()=>{
    const abort=new AbortController();let cancelled=false;
    plan.current=null;
    fetch(`${import.meta.env.BASE_URL}assets/franka-egg-sorting/sorting-motion.json`,{signal:abort.signal})
      .then(async response=>{
        if(!response.ok)throw new Error(`Sorting motion HTTP ${response.status}`);
        const p:unknown=await response.json();
        if(!isValidSortingPlan(p)||p.counts.some(n=>n!==4))throw new Error('Invalid or incomplete four-arm plan');
        if(cancelled)return;plan.current=p;
        callback.current({phase:'ready',label:'Ready · four-arm sorting',counts:[0,0,0,0],arms:Array(4).fill('Ready')});
      }).catch(e=>{if(!cancelled)callback.current({phase:'error',failureSource:'asset',label:'Sorting motion unavailable',reason:String(e),counts:[0,0,0,0],arms:Array(4).fill('Unavailable')});});
    return ()=>{cancelled=true;abort.abort();runtime.current=null;delete window.eggSorting;};
  },[resetGeneration]);
  useEffect(()=>{
    runtime.current?.reset();lastRequest.current=requestId;lastState.current=null;
    if(runtime.current)publish();
  },[resetGeneration]);
  useBeforePhysicsStep((m,d)=>{
    if(requestId>lastRequest.current){
      lastRequest.current=requestId;
      if(!plan.current)return;
      try {
        runtime.current=new EggSortingRuntime(plan.current,{body:n=>findBodyByName(m,n),joint:n=>findJointByName(m,n),site:n=>findSiteByName(m,n)});
        runtime.current.start(m,d);
      }catch(error){
        runtime.current=null;
        callback.current({phase:'error',failureSource:'runtime',label:'Sorting initialization stopped',reason:String(error),counts:[0,0,0,0],arms:Array(4).fill('Stopped')});
      }
    }
    runtime.current?.step(m,d);publish();
  });
  return null;
}
