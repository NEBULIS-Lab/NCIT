import {useLanguage} from '../i18n';

export default function Challenges() {
  const {t} = useLanguage();
  return <section id="approach" className="mx-auto max-w-6xl px-4 sm:px-6">
    <div className="challenge-layout section-border">
      <div className="challenge-intro" data-aos="fade-up">
        <span className="section-kicker">{t('challengeLabel')}</span>
        <h2 className="gradient-heading">{t('challengeHeading')}</h2>
        <p>{t('challengeIntro')}</p>
        <div className="collaboration-motif" aria-hidden="true"><span/><span/><span/><i/></div>
      </div>
      <div className="challenge-list">
        {[1,2,3].map((i) => <article key={i} data-aos="fade-up" data-aos-delay={i * 65}>
          <span className="challenge-number">0{i}</span>
          <div><span className="challenge-tag">{t(`challenge${i}Tag`)}</span><h3>{t(`challenge${i}Title`)}</h3><p>{t(`challenge${i}Desc`)}</p></div>
        </article>)}
      </div>
    </div>
  </section>;
}
