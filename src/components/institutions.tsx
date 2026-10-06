import {useLanguage} from '../i18n';

export default function Institutions() {
  const {t} = useLanguage();
  return <div className="institution-strip mx-auto max-w-6xl px-4 sm:px-6" data-aos="fade-up">
    <div className="institution-intro"><span>{t('institutionLabel')}</span><p>{t('origin')}</p></div>
    <div className="institution-marks">
      <a className="lab-signature" href="https://nebulis-lab.com/" target="_blank" rel="noopener noreferrer" aria-label="NEBULIS Lab">
        <img src="./assets/images/nebulis-mark.webp" alt="" width="44" height="44"/>
        <span>NEBULIS<small>COLLABORATIVE INTELLIGENCE</small></span>
      </a>
      <div className="university-badge"><span className="university-logo"><img src="./assets/images/hkust-gz.png" alt={t('universityName')} width="1732" height="236"/></span></div>
    </div>
  </div>;
}
