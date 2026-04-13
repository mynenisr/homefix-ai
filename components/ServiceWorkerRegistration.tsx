'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[HomeFix SW] Registered, scope:', reg.scope);

        // Check for updates on every page load
        reg.update();

        // Notify user when a new version is available
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[HomeFix SW] New version available — reload to update');
            }
          });
        });
      })
      .catch((err) => console.error('[HomeFix SW] Registration failed:', err));
  }, []);

  return null;
}
