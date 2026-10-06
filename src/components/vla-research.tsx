import {useLanguage} from '../i18n';

export default function VlaResearch() {
  const {t}=useLanguage();
  return <div className="vla-research" data-aos="fade-up">
    <div className="vla-overview">
      <div><span className="section-kicker">{t('vlaLabel')}</span><h3>{t('vlaHeading')}</h3><p>{t('vlaIntro')}</p></div>
      <dl className="vla-results">
        <div><dt>{t('vlaScale')}</dt><dd>2–4<p>{t('vlaScaleDetail')}</p></dd></div>
        <div><dt>{t('vlaTraffic')}</dt><dd>88.8–89.0<span>%</span><p>{t('vlaTrafficDetail')}</p></dd></div>
      </dl>
    </div>
    <div className="vla-paths">{[1,2,3].map(i=><article key={i}><span>0{i}</span><h4>{t(`vla${i}Title`)}</h4><p>{t(`vla${i}Desc`)}</p></article>)}</div>
  </div>;
}
