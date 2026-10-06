import {Fragment} from 'react';
import {useLanguage} from '../i18n';
import {policyCopy,policySources,type Passage} from '../policy-content';

export default function PolicyText({passage}:{passage:Passage}) {
  const {language}=useLanguage();
  return <>{policyCopy[language][passage].map((part,i)=>typeof part==='string'
    ? <Fragment key={i}>{part}</Fragment>
    : <a key={i} className="source-link" href={policySources[part.source].url} title={policySources[part.source].title} target="_blank" rel="noopener noreferrer">{part.text}</a>
  )}</>;
}
