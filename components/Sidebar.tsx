"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackageSearch,
  Settings,
  Users,
  ShoppingCart,
  ShoppingBag,
  BarChart3,
  Bell,
  Search,
  Menu,
  MessageCircle,
  Printer,
  BookOpen,
  Puzzle,
  Gift,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { name: "الرئيسية", href: "/", icon: LayoutDashboard },
  { name: "العروض", href: "/offers", icon: Gift },
  { name: "كوبونات الخصم", href: "/coupons", icon: Ticket },
  { name: "إدارة المنتجات", href: "/products", icon: PackageSearch },
  { name: "الخدمات الإضافية", href: "/addons", icon: Puzzle },
  { name: "الطلبات", href: "/orders", icon: ShoppingCart },
  { name: "السلات المتروكة", href: "/abandoned-carts", icon: ShoppingBag },
  { name: "العملاء", href: "/customers", icon: Users },
  { name: "الموظفين", href: "/staff", icon: Users },
  { name: "مركز المحادثات", href: "/chat", icon: MessageCircle },
  { name: "المدونة", href: "/blog", icon: BookOpen },
  { name: "أقسام المطبوعات", href: "/printing/product-types", icon: Printer },
  { name: "التقارير", href: "/reports", icon: BarChart3 },
  { name: "الإعدادات", href: "/settings", icon: Settings },
];

export default function Sidebar({ 
  isOpen: propIsOpen, 
  onClose 
}: { 
  isOpen?: boolean; 
  onClose?: () => void; 
} = {}) {
  const pathname = usePathname();
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : localIsOpen;

  const handleClose = () => {
    setLocalIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 right-0 z-50 w-64 bg-white border-l border-slate-200 transition-transform duration-300 ease-in-out md:translate-x-0 shadow-xl flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav className="flex-1 px-4 space-y-2 pt-6 custom-scrollbar overflow-y-auto pb-6">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleClose}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-colors duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-slate-50 text-amber-600 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    isActive
                      ? "text-amber-600"
                      : "text-slate-500 group-hover:text-slate-600",
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
