'use client';
import { useEffect, useState } from 'react';

// Detects platform and shows appropriate install instructions
export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Already installed — running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Already dismissed this session
    if (sessionStorage.getItem('pwa-prompt-dismissed')) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as any).standalone;
    setIsIOS(ios);

    if (ios) {
      // Show iOS instructions after 3 seconds
      setTimeout(() => setShow(true), 3000);
    } else {
      // Android/Chrome: capture the beforeinstallprompt event
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShow(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem('pwa-prompt-dismissed', '1');
    setShow(false);
  }

  async function installAndroid() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-192.png" alt="HomeFix AI" className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Install HomeFix AI</p>
            {isIOS ? (
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Tap <strong>Share</strong> <span className="text-base">⎙</span> then{' '}
                <strong>"Add to Home Screen"</strong> for the app experience
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Add to your home screen for quick access — works offline too
              </p>
            )}
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0 mt-0.5">
            ✕
          </button>
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={installAndroid}
            className="mt-3 w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700"
          >
            Add to Home Screen
          </button>
        )}
      </div>
    </div>
  );
}
