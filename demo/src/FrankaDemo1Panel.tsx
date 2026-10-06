import { useEffect } from 'react';
import type { FrankaDemo1Action } from './frankaDemo1.js';
import { useDemoLanguage, announce } from './embed';
interface Props {
 action:FrankaDemo1Action|null; active:boolean; sceneReady:boolean; paused:boolean;
 onPlay:()=>void; onReset:()=>void; onPause:()=>void;
 page:string; pages:Record<string,string>; onPageChange:(page:string)=>void;
}
export function FrankaDemo1Panel({action,active,sceneReady,paused,onPlay,onReset,onPause}:Props) {
 const lang=useDemoLanguage(),zh=lang==='zh',terminal=action==='complete'||action==='error';
 const status=zh?{step1:'四臂就位',step2:'建立物理抓取',step3:'搬运与安装横梁',step4:'安装与敲击紧固件',complete:'装配完成',error:'演示已停止，请重置后重试'}:{step1:'Positioning four arms',step2:'Establishing physical grasps',step3:'Transporting and installing the cross member',step4:'Installing and striking the fastener',complete:'Assembly complete',error:'Stopped. Reset to try again.'};
 useEffect(()=>{announce('ncit-demo-state',{ready:sceneReady,action,paused})},[sceneReady,action,paused]);
 return <section className="franka-demo1-panel" aria-label={zh?'演示控制':'Demo controls'}>
   <div className="franka-demo1-panel__title"><span className="demo-dot"/>Demo1<span className="demo-tag">{zh?'实时仿真':'Live simulation'}</span></div>
   <div className="franka-demo1-panel__actions">
    <button onClick={active&&!terminal?onPause:onPlay} disabled={!sceneReady||terminal}>{!sceneReady?(zh?'加载中…':'Loading…'):terminal?(action==='complete'?(zh?'已完成':'Complete'):(zh?'已停止':'Stopped')):active?(paused?(zh?'继续':'Resume'):(zh?'暂停':'Pause')):(zh?'开始装配':'Run assembly')}</button>
    <button onClick={onReset} disabled={!sceneReady}>{zh?'重置':'Reset'}</button>
   </div>
   <div className="franka-demo1-panel__status" role="status">{!sceneReady?(zh?'正在加载机器人与工位':'Loading robots and workcell'):paused?(zh?'已暂停':'Paused'):action?status[action]:(zh?'拖动旋转视角 · 滚动缩放':'Drag to orbit · Scroll to zoom')}</div>
 </section>
}
