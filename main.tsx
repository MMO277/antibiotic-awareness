import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { LangProvider } from './i18n';
import InstallPrompt from './InstallPrompt';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <LangProvider>
        <App />
        <InstallPrompt />
      </LangProvider>
    </HashRouter>
  </React.StrictMode>,
);

// Register the privacy-safe service worker (static assets only) in production builds.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* PWA is optional; ignore failures */ });
  });
}
