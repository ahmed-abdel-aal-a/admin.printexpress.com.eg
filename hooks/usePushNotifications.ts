"use client";
import { useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
}

export function usePushNotifications(authToken: string, vapidPublicKey: string) {
  useEffect(() => {
    async function subscribeToPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
        }
      }
      if (subscription) {
        await fetch(process.env.NEXT_PUBLIC_API_URL + '/v1/admin/push-subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(subscription)
        });
      }
    }
    if (authToken && vapidPublicKey) subscribeToPush();
  }, [authToken, vapidPublicKey]);
}
