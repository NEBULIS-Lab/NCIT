import {useEffect} from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {useLanguage} from './i18n';
import Header from './components/header';
import HeroHome from './components/hero-home';
import PageIllustration from './components/page-illustration';
import Workflows from './components/workflows';
import Features from './components/features';
import Team from './components/team';
import Roadmap from './components/roadmap';
import Cta from './components/cta';
export default function App(){const{t,language}=useLanguage();
 useEffect(()=>{AOS.init({once:true,disable:()=>matchMedia('(prefers-reduced-motion: reduce)').matches,duration:700,easing:'ease-out-cubic',offset:30})},[]);
 useEffect(()=>{requestAnimationFrame(()=>AOS.refresh())},[language]);
 return <div id="top" className="relative isolate flex min-h-screen flex-col overflow-x-clip"><a className="skip-link" href="#main">{t('skip')}</a><Header/><main id="main"><PageIllustration/><HeroHome/><div className="origin-line"><span>{t('origin')}</span><span>NEBULIS COLLABORATIVE INTELLIGENCE TECHNOLOGY</span></div><Workflows/><Features/><Team/><Roadmap/><Cta/></main><footer className="site-footer mx-auto w-full max-w-6xl px-4 sm:px-6"><div><a className="brand" href="#top"><img src="./assets/images/nebulis-mark.webp" alt="" width="30" height="30"/><strong>NCIT</strong></a><p>{t('copyright')}</p><small>{t('footerStatus')}</small></div><div><a href="https://nebulis-lab.com/" target="_blank" rel="noopener noreferrer">NEBULIS Lab ↗</a><a href="https://github.com/cruip/open-react-template" target="_blank" rel="noopener noreferrer">{t('templateCredit')}</a><a href="#top">{t('backTop')} ↑</a></div></footer></div>
}
