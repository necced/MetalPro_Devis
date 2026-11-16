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

/**
 * Version check & recovery mechanism for stale Service Worker / Cache Storage.
 * - Non-blocking: doesn't prevent app render
 * - User-controlled: only acts on explicit user action
 * - Preserves IndexedDB/Dexie: only clears Cache Storage
 * - No reload loops: runs once per version mismatch
 */
const CURRENT_VERSION = __APP_VERSION__;
const STORAGE_KEY = 'metalpro-app-version';

function checkVersionAndMaybeRecover(): void {
  if (typeof window === 'undefined') return;

  const storedVersion = localStorage.getItem(STORAGE_KEY);

  // First visit or version match → just store current version
  if (!storedVersion || storedVersion === CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    return;
  }

  // Version mismatch → show recovery banner (non-blocking)
  console.log('[main.tsx] Version mismatch detected:', { storedVersion, CURRENT_VERSION });

  // Create recovery banner element
  const banner = document.createElement('div');
  banner.id = 'version-recovery-banner';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: #2563eb; color: white; padding: 0.75rem 1rem;
    text-align: center; font-family: system-ui, sans-serif; font-size: 0.875rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `;
  banner.innerHTML = `
    <strong>Mise à jour disponible</strong> — Une nouvelle version de MetalPro Devis est prête.
    <button id="recovery-btn" style="
      margin-left: 1rem; padding: 0.375rem 0.75rem;
      background: white; color: #2563eb; border: none; border-radius: 0.375rem;
      font-weight: 600; cursor: pointer;
    ">
      Actualiser maintenant
    </button>
  `;

  // Insert before root so it's visible even if root is empty
  document.body.insertBefore(banner, document.body.firstChild);

  // Recovery action: clear Cache Storage, unregister SW, reload
  document.querySelector('#recovery-btn')?.addEventListener('click', async () => {
    const button = document.querySelector('#recovery-btn');
    if (button) button.disabled = true;
    banner.textContent = 'Nettoyage du cache et rechargement...';

    try {
      // Clear all Cache Storage (preserves IndexedDB)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        console.log('[main.tsx] Cache Storage cleared:', cacheNames);
      }

      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
        console.log('[main.tsx] Service Workers unregistered:', registrations.length);
      }

      // Update stored version to prevent loop
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);

      // Reload to fetch fresh assets
      window.location.reload();
    } catch (error) {
      console.error('[main.tsx] Recovery failed:', error);
      banner.textContent = 'Échec de la récupération. Veuillez recharger manuellement (Ctrl+F5).';
      if (button) button.disabled = false;
    }
  });
}

// Run version check BEFORE React renders
checkVersionAndMaybeRecover();

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
