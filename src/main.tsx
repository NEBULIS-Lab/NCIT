import {createRoot} from 'react-dom/client';
import App from './App';
import {LanguageProvider} from './i18n';
import './css/style.css';
import './css/ncit.css';
createRoot(document.getElementById('root')!).render(<LanguageProvider><App/></LanguageProvider>);
