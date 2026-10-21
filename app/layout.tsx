import type { Metadata } from "next";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

export const metadata: Metadata = {
  title: "Apex - لوحة التحكم",
  description: "إدارة المنتجات والمبيعات باحترافية",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPWAInstallPrompt = e;
              });
            `,
          }}
        />
      </head>
      <body
        className="font-cairo bg-[#F4F7FE] text-slate-800 flex h-screen overflow-hidden antialiased selection:bg-amber-100 selection:text-amber-900"
        suppressHydrationWarning
      >
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
