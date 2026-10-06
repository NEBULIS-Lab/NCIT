import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n';
export default function LiveDemo(){
 const {language,t}=useLanguage(),frame=useRef<HTMLIFrameElement>(null),panel=useRef<HTMLDivElement>(null);
 const [generation,setGeneration]=useState(0),[status,setStatus]=useState<'loading'|'ready'|'error'>('loading'),[full,setFull]=useState(false);
 const initialLang=useRef(language);
 const src=`./demo1/?lang=${initialLang.current}&v=${generation}`;
 useEffect(()=>{
   const receive=(event:MessageEvent)=>{if(event.origin!==location.origin||event.source!==frame.current?.contentWindow)return;if(event.data?.type==='ncit-demo-ready'||event.data?.type==='ncit-demo-state'&&event.data.ready){setStatus('ready');const rect=panel.current?.getBoundingClientRect();if(rect)frame.current?.contentWindow?.postMessage({type:'ncit-demo-visibility',visible:rect.bottom>-100&&rect.top<innerHeight+100},location.origin);}if(event.data?.type==='ncit-demo-error')setStatus('error')};
   const fullscreen=()=>setFull(document.fullscreenElement===panel.current);
   window.addEventListener('message',receive);document.addEventListener('fullscreenchange',fullscreen);
   return()=>{window.removeEventListener('message',receive);document.removeEventListener('fullscreenchange',fullscreen)};
 },[]);
 useEffect(()=>{if(status!=='loading')return;const timer=setTimeout(()=>setStatus('error'),90000);return()=>clearTimeout(timer)},[status,generation]);
 useEffect(()=>{frame.current?.contentWindow?.postMessage({type:'ncit-language',language},location.origin)},[language]);
 useEffect(()=>{
   const observer=new IntersectionObserver(([entry])=>frame.current?.contentWindow?.postMessage({type:'ncit-demo-visibility',visible:entry.isIntersecting},location.origin),{rootMargin:'100px'});
   if(panel.current)observer.observe(panel.current);return()=>observer.disconnect();
 },[generation]);
 function reload(){initialLang.current=language;setStatus('loading');setGeneration(v=>v+1)}
 async function fullscreen(){try{document.fullscreenElement?await document.exitFullscreen():await panel.current?.requestFullscreen()}catch{window.open(src,'_blank','noopener,noreferrer')}}
 return <div id="demo" className="demo-anchor" data-aos="fade-up" data-aos-delay="200">
  <div className="live-demo" ref={panel} data-status={status}>
   <div className="demo-bar"><div className="demo-bar-title"><span className="status-dot"/>{t('liveTitle')}</div><div className="demo-bar-actions"><a href={`./demo1/?lang=${language}`} target="_blank" rel="noopener noreferrer">{t('liveOpen')} ↗</a><button onClick={fullscreen} aria-label={full?t('liveExit'):t('liveFull')}>{full?'↙':'⛶'} <span>{full?t('liveExit'):t('liveFull')}</span></button></div></div>
   <div className="demo-viewport">
    <iframe key={generation} ref={frame} src={src} title={t('liveTitle')} allow="fullscreen" onLoad={()=>frame.current?.contentWindow?.postMessage({type:'ncit-language',language},location.origin)} onError={()=>setStatus('error')}/>
    {status!=='ready'&&<div className="demo-loading"><img src="./assets/images/demo-poster.webp" alt=""/><div><span className={status==='loading'?'loader':''}/><p role="status">{t(status==='loading'?'liveLoading':'liveFailure')}</p>{status==='error'&&<button onClick={reload}>{t('liveRetry')}</button>}</div></div>}
   </div>
   <div className="demo-caption"><span><span className="status-dot"/>{t(status==='ready'?'liveReady':status==='error'?'liveFailure':'liveLoading')}</span><span>{t('liveBadge')}</span></div>
  </div>
  <p className="demo-hint">{t('liveHint')}</p>
 </div>
}
