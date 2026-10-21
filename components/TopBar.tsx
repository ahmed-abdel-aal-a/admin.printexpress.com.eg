"use client";
import { Bell, Search, Menu, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import PWAInstallButton from "./PWAInstallButton";

export default function TopBar({ onToggleSidebar }: { onToggleSidebar?: () => void } = {}) {
  const [user] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient('/v1/admin/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    router.push('/login');
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          aria-label="القائمة الجانبية"
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden md:flex items-center relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-4" />
          <input
            type="text"
            placeholder="ابحث عن منتج، طلب، أو عميل..."
            className="pl-4 pr-12 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500 w-80 rounded-full text-sm transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <PWAInstallButton />
        <button className="relative w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center bg-white text-slate-500 hover:text-slate-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 left-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </button>
        <div className="hidden md:flex items-center gap-3 pr-4 border-r border-slate-200">
          <div className="text-left text-xs leading-tight">
            <p className="font-bold text-slate-800">{user?.name || "المستخدم"}</p>
            <p className="text-slate-400">{user?.roles?.[0] || "مدير النظام"}</p>
          </div>
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Admin")}&background=f59e0b&color=fff`}
            width={40}
            height={40}
            alt="User"
            className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm"
            referrerPolicy="no-referrer"
          />
          <button onClick={handleLogout} className="mr-2 p-2 text-slate-400 hover:text-rose-500 transition-colors" title="تسجيل الخروج">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
