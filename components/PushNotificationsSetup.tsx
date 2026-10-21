"use client";
import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PushNotificationsSetup() {
  const [token, setToken] = useState<string>('');
  
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) setToken(storedToken);
  }, []);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  
  usePushNotifications(token, vapidKey);

  return null;
}
