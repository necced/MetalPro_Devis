import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App.tsx';

// Use environment variable for basename, default to /metalpro-devis-mvp for production
// In development, default to '/' for local testing
const isDev = import.meta.env.DEV;
const rawBasename = import.meta.env.VITE_BASENAME;
const basename =
  isDev && (!rawBasename || rawBasename.includes('Program Files'))
    ? '/'
    : rawBasename || '/metalpro-devis-mvp';

console.log('[main.tsx] Starting app with basename:', basename);
console.log('[main.tsx] Raw VITE_BASENAME:', rawBasename);
console.log('[main.tsx] DEV:', isDev);
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
