import {useDemoLanguage} from './embed';
import {useState} from 'react';
import type {MutableRefObject} from 'react';
import {CAMERA_KEYS,CAMERA_LABELS,selectedCameraViews} from './assemblyCameras.js';

export type CameraTiles=MutableRefObject<Map<string,HTMLDivElement>>;
export function AssemblyCameraPanel({selection,onSelection,tiles,status}:{selection:string;onSelection:(value:string)=>void;tiles:CameraTiles;status:string}){
  const [open,setOpen]=useState(false);
  const zh=useDemoLanguage()==='zh';
  const labels=zh?['全局相机','机械臂 1','机械臂 2','机械臂 3','机械臂 4']:CAMERA_LABELS;
  return <section className={`assembly-cameras-panel ${selection==='all'&&open?'assembly-cameras-panel--all':''}`} aria-label={zh?'相机视角':'Camera views'}>
    <header>
      <button type="button" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?(zh?'收起相机':'Hide cameras'):(zh?'相机视角':'Cameras')}</button>
      {open&&<select aria-label={zh?'选择相机':'Camera view'} value={selection} onChange={e=>onSelection(e.target.value)}>
        {CAMERA_KEYS.map((key:string,i:number)=><option value={key} key={key}>{labels[i]}</option>)}
        <option value="all">{zh?'全部五个相机':'All five cameras'}</option>
      </select>}
      {open&&<span className="assembly-cameras-panel__badge">RGB · 10 Hz</span>}
    </header>
    {open&&<div className="assembly-cameras-panel__views">
      {selectedCameraViews(selection).map((key:string)=><figure key={key}>
        <div className="assembly-camera-tile" data-camera={key} ref={node=>{if(node)tiles.current.set(key,node);else tiles.current.delete(key);}} />
        <figcaption>{labels[CAMERA_KEYS.indexOf(key)]}</figcaption>
      </figure>)}
    </div>}
    {open&&status!=='ready'&&<p role="status">{status==='loading'?(zh?'正在加载相机…':'Loading cameras…'):status}</p>}
  </section>;
}
