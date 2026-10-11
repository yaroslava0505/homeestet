import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initLocale } from './i18n/index.ts';
import './index.css';

// Language is fixed for the life of the page: `/ru/...` is Russian, everything else Ukrainian.
const redirect = initLocale(window.location.pathname);
if (redirect) window.location.replace(redirect + window.location.search);

createRoot(document.getElementById('root')!).render(<App />);
