import { Component, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { announce, useDemoLanguage } from './embed';
function Failure(){
 const en=useDemoLanguage()==='en';
 useEffect(()=>{announce('ncit-demo-error');document.documentElement.dataset.sceneStatus='error'},[en]);
 return <div style={{padding:30,fontFamily:'Arial',color:'#202236'}} role="alert"><h1 style={{fontSize:20}}>{en?'The interactive scene could not start':'交互场景未能启动'}</h1><p>{en?'Try reloading or opening the demo in a browser that supports WebGL.':'请重新加载，或使用支持 WebGL 的浏览器打开。'}</p><button onClick={()=>location.reload()} style={{marginTop:20,padding:'10px 20px'}}>{en?'Reload':'重新加载'}</button></div>;
}
class DemoBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<Failure/>:this.props.children}
}
// Canvas creation may throw outside React's tree. Check support before mounting.
function supportsWebGL(){
 try{const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2');if(!gl)return false;gl.getExtension('WEBGL_lose_context')?.loseContext();return true}catch{return false}
}
const root=createRoot(document.getElementById('root')!);
window.addEventListener('error',event=>{if(/WebGL context/i.test(event.message)){root.render(<Failure/>);announce('ncit-demo-error')}});
window.addEventListener('webglcontextlost',()=>{announce('ncit-demo-error')},true);
root.render(supportsWebGL()?<DemoBoundary><App/></DemoBoundary>:<Failure/>);
