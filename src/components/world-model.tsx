import {useLanguage} from '../i18n';
export default function WorldModel(){const{t}=useLanguage();return <div className="world-model" aria-label={t('diagramAlt')}>
 <div className="world-model-input">{t('diagramTop')}</div>
 <div className="world-model-center"><img src="./assets/images/nebulis-mark.webp" alt=""/><strong>{t('diagramCenter')}</strong><span>{t('diagramSub')}</span></div>
 <svg className="world-connections" viewBox="0 0 800 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="connection" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#818cf8" stopOpacity=".15"/></linearGradient></defs>{[100,300,500,700].map(x=><g key={x}><path d={`M400 0 V20 Q400 45 ${x} 45 Q${x} 45 ${x} 70 V100`} stroke="url(#connection)" fill="none"/><path className="signal" d={`M400 0 V20 Q400 45 ${x} 45 Q${x} 45 ${x} 70 V100`} fill="none"/></g>)}</svg>
 <div className="world-roles">{['roleA','roleB','roleC','roleD'].map((key,i)=><div key={key}><span>0{i+1}</span><strong>{t(key)}</strong></div>)}</div>
 <div className="world-feedback">{t('diagramBottom')}</div>
 </div>}
