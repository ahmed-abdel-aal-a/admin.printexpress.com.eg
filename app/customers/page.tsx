"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

import {
  Search,
  ListFilter,
  Smartphone,
  Monitor,
  Instagram,
  Facebook,
  Compass,
  ExternalLink,
  Sparkles,
  Users,
  TrendingUp,
  BarChart3,
  Eye,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetcher as defaultFetcher, rawFetcher } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Customer, AcquisitionSource, CustomerSourceStats } from "./types";

// TikTok Vector Icon (Strictly SVG, 0 Emojis)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
  </svg>
);

// Google Vector Icon (Multi-color SVG)
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
  </svg>
);

// Snapchat Ghost Vector Icon (Black fill for high contrast)
const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.004 2c-3.524 0-5.834 2.502-5.834 5.378 0 .808.188 1.826.474 2.454.12.26.06.478-.13.626-.356.278-.962.59-1.564.738-.344.084-.52.288-.476.544.072.418.572.716 1.408.82.264.032.418.196.444.454.088.854.89 1.488 2.062 1.636-.594.458-1.536.874-2.616 1.106-.328.07-.5.252-.456.486.082.44 1.05.772 2.378.854.21.014.338.12.338.28 0 .972.636 1.77 1.674 2.072.244.072.374.228.318.472-.116.51-.55 1.104-1.246 1.484-.298.162-.358.374-.15.548.496.416 1.782.556 3.394.556 1.614 0 2.9-.14 3.396-.556.208-.174.148-.386-.15-.548-.696-.38-1.13-.974-1.246-1.484-.056-.244.074-.4.318-.472 1.038-.302 1.674-1.1 1.674-2.072 0-.16.128-.266.338-.28 1.328-.082 2.296-.414 2.378-.854.044-.234-.128-.416-.456-.486-1.08-.232-2.022-.648-2.616-1.106 1.172-.148 1.974-.782 2.062-1.636.026-.258.18-.422.444-.454.836-.104 1.336-.402 1.408-.82.044-.256-.132-.46-.476-.544-.602-.148-1.208-.46-1.564-.738-.19-.148-.25-.366-.13-.626.286-.628.474-1.646.474-2.454C17.838 4.502 15.528 2 12.004 2z"/>
  </svg>
);

const SourceIcon = ({
  source,
  className,
}: {
  source: AcquisitionSource | string;
  className?: string;
}) => {
  switch (source) {
    case "ai":
      return <Sparkles className={className} />;
    case "tiktok":
      return <TikTokIcon className={className} />;
    case "google":
      return <GoogleIcon className={className} />;
    case "facebook":
      return <Facebook className={className} />;
    case "instagram":
      return <Instagram className={className} />;
    case "snapchat":
      return <SnapchatIcon className={className} />;
    case "referral":
      return <ExternalLink className={className} />;
    case "direct":
    default:
      return <Compass className={className} />;
  }
};

const getSourceBadgeStyle = (source: string) => {
  switch (source) {
    case "ai":
      return {
        bg: "bg-violet-50 text-violet-700 border-violet-200",
        bar: "bg-violet-600",
        ring: "ring-violet-500",
        iconBox: "bg-violet-600 text-white",
      };
    case "tiktok":
      return {
        bg: "bg-slate-50 text-slate-900 border-slate-200",
        bar: "bg-slate-900",
        ring: "ring-slate-900",
        iconBox: "bg-black text-white",
      };
    case "google":
      return {
        bg: "bg-blue-50 text-slate-800 border-blue-200",
        bar: "bg-blue-500",
        ring: "ring-blue-500",
        iconBox: "bg-white border border-slate-200",
      };
    case "facebook":
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        bar: "bg-blue-600",
        ring: "ring-blue-600",
        iconBox: "bg-[#1877F2] text-white",
      };
    case "instagram":
      return {
        bg: "bg-pink-50 text-pink-700 border-pink-200",
        bar: "bg-pink-500",
        ring: "ring-pink-500",
        iconBox: "bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white",
      };
    case "snapchat":
      return {
        bg: "bg-amber-50 text-amber-900 border-amber-200",
        bar: "bg-amber-400",
        ring: "ring-amber-400",
        iconBox: "bg-[#FFFC00] text-black border border-amber-300 shadow-sm",
      };
    case "referral":
      return {
        bg: "bg-slate-50 text-slate-700 border-slate-200",
        bar: "bg-slate-400",
        ring: "ring-slate-500",
        iconBox: "bg-slate-600 text-white",
      };
    case "direct":
    default:
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        bar: "bg-emerald-500",
        ring: "ring-emerald-500",
        iconBox: "bg-emerald-600 text-white",
      };
  }
};

const SourceLabel = ({ source }: { source: AcquisitionSource | string }) => {
  const map: Record<string, string> = {
    ai: "ذكاء اصطناعي",
    direct: "مباشر",
    facebook: "فيسبوك",
    instagram: "انستجرام",
    tiktok: "تيك توك",
    google: "جوجل",
    snapchat: "سناب شات",
    referral: "إحالة خارجية",
  };

  return <span>{map[source] || source || "مباشر"}</span>;
};

export default function CustomersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    source: "",
    device: "",
    status: "",
    sort: "latest",
    min_spent: "",
    max_spent: "",
    date_from: "",
    date_to: "",
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 1. Fetch traffic source analytics with SWR (cached & background-revalidated)
  const { data: sourceStats } = useSWR<CustomerSourceStats>(
    '/v1/admin/customers/stats/sources',
    defaultFetcher,
    { revalidateOnFocus: false }
  );

  // 2. Build query URL immediately on filter changes
  const searchParams = new URLSearchParams();
  searchParams.set("page", currentPage.toString());
  if (debouncedSearchTerm) searchParams.set("search", debouncedSearchTerm);
  if (filters.source && filters.source !== "all") searchParams.set("source", filters.source);
  if (filters.device && filters.device !== "all") searchParams.set("device", filters.device);
  if (filters.status && filters.status !== "all") searchParams.set("status", filters.status);
  if (filters.sort) searchParams.set("sort", filters.sort);
  if (filters.min_spent) searchParams.set("min_spent", filters.min_spent);
  if (filters.max_spent) searchParams.set("max_spent", filters.max_spent);
  if (filters.date_from) searchParams.set("date_from", filters.date_from);
  if (filters.date_to) searchParams.set("date_to", filters.date_to);

  const apiUrl = `/v1/admin/customers?${searchParams.toString()}`;

  // 3. Instant data fetching with keepPreviousData: zero screen flashes, zero unmounting
  const { data: customersData, error, isLoading, isValidating } = useSWR(
    apiUrl,
    rawFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const customers: Customer[] = customersData?.data || [];
  const totalPages = customersData?.meta?.last_page || customersData?.last_page || 1;
  const totalCustomers = customersData?.meta?.total || customersData?.total || 0;

  // Quick toggle filter from chart
  const handleToggleSourceFilter = (sourceKey: string) => {
    setCurrentPage(1);
    setFilters((prev) => ({
      ...prev,
      source: prev.source.toLowerCase() === sourceKey.toLowerCase() ? "" : sourceKey,
    }));
  };

  // Reset to page 1 when search term or filters change
  const currentFilterKey = `${debouncedSearchTerm}-${filters.source}-${filters.device}-${filters.status}-${filters.sort}-${filters.min_spent}-${filters.max_spent}-${filters.date_from}-${filters.date_to}`;
  const [prevFilterKey, setPrevFilterKey] = useState(currentFilterKey);
  if (currentFilterKey !== prevFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            العملاء والزوار
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            إدارة بيانات العملاء وتتبع سلوكهم في المتجر
          </p>
        </div>
      </div>

      {/* Analytics Card: Acquisition Sources & AI Tracking */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                تحليلات قنوات الترافيك والذكاء الاصطناعي
              </h2>
              <p className="text-xs text-slate-500">
                توزيع الزوار بحسب المنصات ومحركات الذكاء الاصطناعي (انقر على أي منصة للفلترة الفورية)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {filters.source && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters((f) => ({ ...f, source: "" }))}
                className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg px-2"
              >
                إلغاء الفلترة
              </Button>
            )}
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              إجمالي المتتبعين: {sourceStats?.total_customers ?? totalCustomers}
            </span>
          </div>
        </div>

        {/* Segmented Distribution Bar */}
        {sourceStats && sourceStats.sources && sourceStats.sources.length > 0 && (
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {sourceStats.sources.map((item) => {
                const badge = getSourceBadgeStyle(item.source);
                return (
                  <div
                    key={item.source}
                    style={{ width: `${Math.max(item.percentage, 2)}%` }}
                    className={`${badge.bar} transition-all duration-300 relative group cursor-pointer hover:opacity-90`}
                    title={`${item.source}: ${item.percentage}% (${item.visitors} زائر)`}
                    onClick={() => handleToggleSourceFilter(item.source)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Source Badges Grid with Quick Filter Action */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5 pt-1">
          {/* All button */}
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, source: "" }))}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
              !filters.source
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${
              !filters.source ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200"
            }`}>
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold leading-tight">الكل</span>
            <span className="text-[11px] opacity-75 mt-0.5 font-medium">
              {sourceStats?.total_customers ?? totalCustomers}
            </span>
          </button>

          {/* Individual Sources: AI, TikTok, Google, Facebook, Instagram, Snapchat, Direct, Referral */}
          {["ai", "tiktok", "google", "facebook", "instagram", "snapchat", "direct", "referral"].map((sourceKey) => {
            const stat = sourceStats?.sources?.find((s) => s.source.toLowerCase() === sourceKey);
            const count = stat?.visitors ?? 0;
            const percentage = stat?.percentage ?? 0;
            const isSelected = filters.source.toLowerCase() === sourceKey;
            const badge = getSourceBadgeStyle(sourceKey);

            return (
              <button
                key={sourceKey}
                type="button"
                onClick={() => handleToggleSourceFilter(sourceKey)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all relative ${
                  isSelected
                    ? "ring-2 ring-amber-500 bg-amber-500/10 border-amber-500 shadow-sm font-bold"
                    : "bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${badge.iconBox}`}>
                  <SourceIcon source={sourceKey} className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  <SourceLabel source={sourceKey} />
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {count} {percentage > 0 ? `(${percentage}%)` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="ابحث بالاسم، الجوال، أو الـ IP..."
              className="pr-9 h-11 rounded-xl bg-slate-50 border-slate-200 w-full focus-visible:ring-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-11 rounded-xl px-4 w-full sm:w-auto gap-2 text-slate-600 border-slate-200"
              >
                <ListFilter className="w-4 h-4" />
                <span className="font-semibold">تصفية</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>تصفية العملاء</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">المصدر</label>
                  <Select value={filters.source} onValueChange={(val) => setFilters(f => ({ ...f, source: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="ai">ذكاء اصطناعي (AI)</SelectItem>
                      <SelectItem value="direct">مباشر</SelectItem>
                      <SelectItem value="facebook">فيسبوك</SelectItem>
                      <SelectItem value="instagram">انستجرام</SelectItem>
                      <SelectItem value="tiktok">تيك توك</SelectItem>
                      <SelectItem value="google">جوجل</SelectItem>
                      <SelectItem value="snapchat">سناب شات</SelectItem>
                      <SelectItem value="referral">إحالة خارجية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">الجهاز</label>
                  <Select value={filters.device} onValueChange={(val) => setFilters(f => ({ ...f, device: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="mobile">جوال</SelectItem>
                      <SelectItem value="desktop">كمبيوتر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">حالة العميل</label>
                  <Select value={filters.status} onValueChange={(val) => setFilters(f => ({ ...f, status: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="banned">محظور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">الترتيب</label>
                  <Select value={filters.sort} onValueChange={(val) => setFilters(f => ({ ...f, sort: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="الترتيب..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">الأحدث</SelectItem>
                      <SelectItem value="oldest">الأقدم</SelectItem>
                      <SelectItem value="top_spenders">الأكثر إنفاقاً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">الحد الأدنى للإنفاق</label>
                  <Input type="number" placeholder="مثال: 100" value={filters.min_spent} onChange={(e) => setFilters(f => ({ ...f, min_spent: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">الحد الأقصى للإنفاق</label>
                  <Input type="number" placeholder="مثال: 5000" value={filters.max_spent} onChange={(e) => setFilters(f => ({ ...f, max_spent: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">من تاريخ</label>
                  <Input type="date" value={filters.date_from} onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">إلى تاريخ</label>
                  <Input type="date" value={filters.date_to} onChange={(e) => setFilters(f => ({ ...f, date_to: e.target.value }))} className="h-12 rounded-2xl bg-slate-50 border-slate-100" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className="h-11 rounded-xl w-full sm:w-auto px-8 bg-amber-500 hover:bg-amber-600 text-white font-bold">
                    تطبيق الفلاتر
                  </Button>
                </DialogClose>
                <Button variant="outline" className="h-11 rounded-xl w-full sm:w-auto" onClick={() => setFilters({ source: "", device: "", status: "", sort: "latest", min_spent: "", max_spent: "", date_from: "", date_to: "" })}>
                  إعادة ضبط
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto w-full">
          {isValidating && (
            <div className="h-1 w-full bg-blue-100/70 overflow-hidden">
              <div className="h-full bg-blue-600 animate-pulse w-full"></div>
            </div>
          )}
          <table className="w-full min-w-[800px] text-sm text-right">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">العميل / الجوال</th>
                <th className="px-6 py-4 whitespace-nowrap">الـ IP / الجهاز</th>
                <th className="px-6 py-4 whitespace-nowrap">المصدر</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">
                  الزيارات
                </th>
                <th className="px-6 py-4 whitespace-nowrap text-center">
                  إجمالي الطلبات
                </th>
                <th className="px-6 py-4 whitespace-nowrap text-center">
                  المدفوعات
                </th>
                <th className="px-6 py-4 whitespace-nowrap">آخر ظهور</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && !customersData ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-28 mb-1.5"></div>
                      <div className="h-3 bg-slate-100 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-24 mb-1.5"></div>
                      <div className="h-3 bg-slate-100 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-slate-100 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-6 bg-slate-100 rounded-full w-8 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-6 bg-slate-100 rounded-full w-8 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-4 bg-slate-200 rounded w-16 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-slate-100 rounded w-14"></div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-8 w-8 bg-slate-100 rounded-lg mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-rose-600 font-bold bg-rose-50/50"
                  >
                    حدث خطأ في جلب بيانات العملاء. يرجى المحاولة لاحقاً.
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    لا يوجد عملاء يطابقون بحثك
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-slate-50/50 transition-colors ${isValidating ? "opacity-75" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {customer.name || "غير مسجل (زائر)"}
                        </span>
                        <span
                          className="text-slate-500 text-xs mt-0.5"
                          dir="ltr"
                        >
                          {customer.phone || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700 font-mono text-xs">
                          {customer.ipAddress || "-"}
                        </span>
                        <span className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                          {customer.device?.toLowerCase().includes("iphone") ||
                          customer.device?.toLowerCase().includes("galaxy") ||
                          customer.device?.toLowerCase().includes("mobile") ? (
                            <Smartphone className="w-3 h-3" />
                          ) : (
                            <Monitor className="w-3 h-3" />
                          )}
                          {customer.device || "غير محدد"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${getSourceBadgeStyle(customer.source).iconBox}`}>
                          <SourceIcon
                            source={customer.source}
                            className="w-3.5 h-3.5"
                          />
                        </div>
                        <span className="text-slate-700 font-medium text-xs">
                          <SourceLabel source={customer.source} />
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 h-6 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100/80">
                        {customer.visitsCount ?? 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[2rem] h-6 rounded-full text-xs font-bold ${customer.totalOrders > 0 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                      >
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="font-bold text-slate-800">
                        {customer.totalSpent > 0
                          ? `${customer.totalSpent.toLocaleString()} ر.س`
                          : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.lastSeen ? (
                        <div className="flex flex-col">
                          <span className="text-slate-700 font-medium">
                            {new Date(customer.lastSeen).toLocaleDateString(
                              "ar-EG",
                            )}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {new Date(customer.lastSeen).toLocaleTimeString(
                              "ar-EG",
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/customers/view?id=${customer.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentPage === 1 || isLoading}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="w-24 border-slate-200"
          >
            السابق
          </Button>
          <span className="text-sm font-medium text-slate-600">
            صفحة {currentPage} من {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages || isLoading}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="w-24 border-slate-200"
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}


