import Icon from './components/icon';
import {useEffect} from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {useLanguage} from './i18n';
import Header from './components/header';
import HeroHome from './components/hero-home';
import PageIllustration from './components/page-illustration';
import Institutions from './components/institutions';
import Workflows from './components/workflows';
import Challenges from './components/challenges';
import Features from './components/features';
import Team from './components/team';
import Roadmap from './components/roadmap';
import Partnership from './components/partnership';
import Cta from './components/cta';

export default function App(){
 const {t,language}=useLanguage();
 useEffect(()=>{
   AOS.init({once:true,disable:()=>matchMedia('(prefers-reduced-motion: reduce)').matches,duration:650,easing:'ease-out-cubic',offset:35});
   const observer=new IntersectionObserver(entries=>{for(const entry of entries)(entry.target as HTMLElement).dataset.visible=String(entry.isIntersecting)},{rootMargin:'80px'});
   document.querySelectorAll('.world-model,.collaboration-motif').forEach(element=>observer.observe(element));
   return()=>observer.disconnect();
 },[]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>AOS.refresh());return()=>cancelAnimationFrame(frame)},[language]);
 return <div id="top" className="relative isolate flex min-h-screen flex-col overflow-x-clip">
   <a className="skip-link" href="#main">{t('skip')}</a><Header/>
   <main id="main"><PageIllustration/><HeroHome/><Institutions/><Workflows/><Challenges/><Features/><Team/><Roadmap/><Partnership/><Cta/></main>
   <footer className="site-footer mx-auto w-full max-w-6xl px-4 sm:px-6">
     <div className="footer-identity"><a className="brand" href="#top"><img src="./assets/images/nebulis-mark.webp" alt="" width="30" height="30"/><strong>NCIT</strong></a><p className="footer-company" lang="en">{t('companyName')}</p><small>{t('footerStatus')}</small></div>
     <div><a href="#partnership">{t('navPartnership')} <Icon name="arrow-right"/></a><a href="https://nebulis-lab.com/" target="_blank" rel="noopener noreferrer">NEBULIS Lab <Icon name="arrow-up-right"/></a><a href="#top">{t('backTop')} <Icon name="arrow-up"/></a></div>
   </footer>
 </div>;
}
