import { useEffect, useState } from 'react';
export type Language = 'zh'|'en';
export function useDemoLanguage() {
  const [language,setLanguage] = useState<Language>(new URLSearchParams(location.search).get('lang')==='en'?'en':'zh');
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='ncit-language')return;
      setLanguage(event.data.language==='en'?'en':'zh');
    };
    addEventListener('message',receive);return()=>removeEventListener('message',receive);
  },[]);
  useEffect(()=>{document.documentElement.lang=language==='zh'?'zh-CN':'en'},[language]);
  return language;
}
export function announce(type:string,detail:Record<string,unknown>={}) {
  if(window.parent!==window)window.parent.postMessage({type,...detail},location.origin);
}
