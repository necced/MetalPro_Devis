import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App.tsx';

// basename depuis variable d'environnement, défaut à '/' pour déploiement racine Netlify
const basename = import.meta.env.VITE_BASENAME || '/';

console.log('[main.tsx] Starting app with basename:', basename);
console.log('[main.tsx] Raw VITE_BASENAME:', import.meta.env.VITE_BASENAME);
console.log('[main.tsx] DEV:', import.meta.env.DEV);
console.log('[main.tsx] Root element:', document.querySelector('#root'));

const root = createRoot(document.querySelector('#root')!);
console.log('[main.tsx] Root created, rendering...');

root.render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

console.log('[main.tsx] Render complete');
