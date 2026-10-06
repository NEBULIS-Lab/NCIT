import Icon from './icon';
import PolicyText from './policy-text';
import {useLanguage} from '../i18n';

export default function Partnership() {
  const {t} = useLanguage();
  return <section id="partnership" className="mx-auto max-w-6xl px-4 sm:px-6 section-border">
    <div className="py-16 md:py-20">
      <div className="section-heading" data-aos="fade-up"><span className="section-kicker">{t('partnershipLabel')}</span><h2 className="gradient-heading">{t('partnershipHeading')}</h2><p><PolicyText passage="partnershipIntro"/></p></div>
      <ol className="partnership-steps">{[1,2,3,4].map(i => <li key={i} data-aos="fade-up" data-aos-delay={(i - 1) * 80}>
        <span className="partnership-number">0{i}<Icon name="arrow-up-right"/></span><h3>{t(`partnership${i}Title`)}</h3><p>{t(`partnership${i}Desc`)}</p>
      </li>)}</ol>
      <div className="partnership-bottom"><p>{t('partnershipNote')}</p><a href="mailto:ningxinsu@hkust-gz.edu.cn?subject=NCIT%20Workcell%20Collaboration">{t('partnershipCta')} <Icon name="arrow-right"/></a></div>
    </div>
  </section>;
}
