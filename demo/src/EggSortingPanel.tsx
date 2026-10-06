import {useState,type ReactNode} from 'react';
import type {SortingState} from './eggSorting.js';

const classes=['Ivory','Brown','Pale green','Cream'];

/** Presentation only: no task clock, actuator or object state is changed here. */
export function EggSortingPanel({state,paused,canRun,onRun,children}:{
  state:SortingState;paused:boolean;canRun:boolean;onRun:()=>void;children:ReactNode;
}){
  const [expanded,setExpanded]=useState(true);
  const completed=state.counts.reduce((sum,n)=>sum+n,0);
  const waiting=state.phase==='running'&&state.arms.some(label=>label.startsWith('Waiting'));
  return <aside aria-label="Egg sorting scene review" className="egg-sorting-panel">
    <header>
      <strong>Mixed Egg Sorting</strong>
      <button type="button" className="egg-sorting-panel__toggle" aria-expanded={expanded}
        aria-controls="egg-sorting-details" aria-label={expanded?'Collapse sorting details':'Expand sorting details'}
        onClick={()=>setExpanded(value=>!value)}>{expanded?'−':'+'}</button>
    </header>
    <div className="egg-sorting-panel__subtitle">4 arms · 16 eggs · contact-driven</div>
    <button type="button" className="egg-sorting-panel__run" disabled={!canRun} onClick={onRun}>Run four-arm sorting</button>
    <progress aria-label="Completed eggs" max={16} value={completed}/>
    <div role="status">{state.label}</div>
    {paused&&<div className="egg-sorting-panel__notice">Paused · simulation and task clock are stopped</div>}
    {state.reason&&<div role="alert" className="egg-sorting-panel__error">{state.reason} · Reset to retry</div>}
    <div id="egg-sorting-details" hidden={!expanded}>
      <div className="egg-sorting-panel__arms">
        {state.arms.map((label,a)=><div className="egg-sorting-panel__arm" key={a}>
          <div><strong>Arm {a+1}</strong><span>{state.counts[a]} / 4</span></div>
          <small>{classes[a]}</small>
          <div className="egg-sorting-panel__phase">{state.phase==='error'?'Stopped':label}</div>
        </div>)}
      </div>
      {waiting&&<p className="egg-sorting-panel__hint">Waiting arms yield the shared pickup path; other arms keep working.</p>}
      {state.phase==='complete'&&<p className="egg-sorting-panel__hint">All trays verified. Reset before the next run.</p>}
      {children}
    </div>
  </aside>;
}
