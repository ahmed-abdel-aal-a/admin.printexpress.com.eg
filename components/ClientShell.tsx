'use client';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SWRConfig } from 'swr';
import { Toaster, toast } from 'react-hot-toast';

import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

const PushNotificationsSetup = dynamic(() => import('@/components/PushNotificationsSetup'), { ssr: false });

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname() || '';
  const isLoginPage = pathname.includes('/login');

  return (
    <QueryClientProvider client={queryClient}>
      <SWRConfig 
        value={{
          errorRetryCount: 3,
          shouldRetryOnError: (error: any) => {
            // Don't retry on 401, 404, or 500
            if (error?.status === 401 || error?.status === 404 || error?.status === 500) return false;
            return true;
          },
          onError: (error: any) => {
            if (error?.status !== 401) {
              const errorMessage = error?.message || 'حدث خطأ في الاتصال بالخادم';
              toast.error(errorMessage, { id: errorMessage });
            }
          }
        }}
      >
        <Toaster position="top-center" />
        {!isLoginPage && <PushNotificationsSetup />}
        {!isLoginPage && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
        <div className={`flex-1 flex flex-col h-screen overflow-hidden relative ${isLoginPage ? 'bg-[#0f172a]' : ''}`}>
          {!isLoginPage && <TopBar onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />}
          <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isLoginPage ? 'p-0' : 'p-4 md:p-8 bg-transparent'}`}>
            {children}
          </main>
        </div>
      </SWRConfig>
    </QueryClientProvider>
  );
}
