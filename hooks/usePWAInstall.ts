"use client";
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    deferredPWAInstallPrompt: any;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // 1. الشيك السريع (لو السكريبت اصطاده)
    if (window.deferredPWAInstallPrompt) {
      setDeferredPrompt(window.deferredPWAInstallPrompt);
      setIsInstallable(true);
    }

    // 2. الاستماع العادي (تحسباً لأي تأخير)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPWAInstallPrompt = e;
      setIsInstallable(true);
    };
    const handleAppInstalled = () => {
      setIsInstallable(false);
      window.deferredPWAInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      window.deferredPWAInstallPrompt = null;
      setIsInstallable(false);
    }
  };

  return { isInstallable, installApp };
}
