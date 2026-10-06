import {useState,useEffect} from 'react';
import {useLanguage} from '../i18n';

const items=[['solutions','navSolution'],['technology','navTech'],['demo','navDemo'],['team','navTeam'],['partnership','navPartnership']];
export default function Header(){
 const {language,setLanguage,t}=useLanguage();
 const [open,setOpen]=useState(false),[active,setActive]=useState('');
 useEffect(()=>{
   const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
   const media=matchMedia('(min-width: 641px)');
   const reset=()=>setOpen(false);
   addEventListener('keydown',close);media.addEventListener('change',reset);
   const observer=new IntersectionObserver(entries=>{
     for(const entry of entries)if(entry.isIntersecting)setActive(entry.target.id);
   },{rootMargin:'-15% 0px -65% 0px',threshold:0});
   for(const [id] of items){const section=document.getElementById(id);if(section)observer.observe(section)}
   return()=>{removeEventListener('keydown',close);media.removeEventListener('change',reset);observer.disconnect()};
 },[]);
 return <header className="site-header-wrap z-30 mt-2 w-full md:mt-5"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="site-header relative flex h-16 items-center justify-between gap-3 rounded-2xl px-4 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
   <a href="#top" className="brand" aria-label={`NCIT · ${t('companyName')}`}><img src="./assets/images/nebulis-mark.webp" alt="" width="32" height="32"/><strong>NCIT</strong></a>
   <nav className="desktop-nav" aria-label={t('mainNav')}>{items.map(([id,key])=><a key={id} href={`#${id}`} aria-current={active===id?'location':undefined}>{t(key)}</a>)}</nav>
   <div className="header-actions"><button id="language-toggle" className="btn-sm language-toggle" onClick={()=>setLanguage(language==='zh'?'en':'zh')} aria-label={language==='zh'?'Switch to English':'切换到中文'}>{language==='zh'?'EN':'中文'}</button><a className="btn-sm header-contact bg-linear-to-t from-indigo-600 to-indigo-500 text-white" href="#contact">{t('contactUs')} <span aria-hidden="true">→</span></a><button className="menu-toggle" aria-expanded={open} aria-controls="mobile-nav" aria-label={t(open?'closeMenu':'menu')} onClick={()=>setOpen(!open)}>{open?'×':'☰'}</button></div>
 </div>{open&&<nav id="mobile-nav" className="mobile-nav" aria-label={t('mobileNav')}>{items.map(([id,key])=><a key={id} href={`#${id}`} aria-current={active===id?'location':undefined} onClick={()=>setOpen(false)}>{t(key)}</a>)}<a href="#contact" onClick={()=>setOpen(false)}>{t('contactUs')}</a></nav>}</div></header>;
}
