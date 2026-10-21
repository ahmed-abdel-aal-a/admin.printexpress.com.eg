"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetcher } from "@/lib/api";

import {
  ArrowRight,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Smartphone,
  Monitor,
  ShoppingBag,
  Clock,
  ArrowRightLeft,
  LogIn,
  LogOut,
  Search,
  CreditCard,
  CheckCircle2,
  Footprints,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const EventIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "enter":
      return <LogIn className="w-4 h-4 text-emerald-500" />;
    case "view":
      return <Search className="w-4 h-4 text-blue-500" />;
    case "add_to_cart":
      return <ShoppingBag className="w-4 h-4 text-amber-500" />;
    case "checkout":
      return <CreditCard className="w-4 h-4 text-indigo-500" />;
    case "purchase":
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case "exit":
      return <LogOut className="w-4 h-4 text-rose-500" />;
    default:
      return <ArrowRightLeft className="w-4 h-4 text-slate-400" />;
  }
};

const EventLabel = ({ type }: { type: string }) => {
  switch (type) {
    case "enter":
      return "دخول للمتجر";
    case "view":
      return "تصفح صفحة";
    case "add_to_cart":
      return "إضافة للسلة";
    case "checkout":
      return "بدء الدفع";
    case "purchase":
      return "إتمام الطلب";
    case "exit":
      return "مغادرة المتجر";
    default:
      return "نشاط";
  }
};

interface GroupedSession {
  sessionId: string;
  sessionIndex: number;
  startTime: string;
  endTime: string;
  events: any[];
  hasPurchase: boolean;
  hasAddToCart: boolean;
  hasCheckout: boolean;
}

function formatArabicDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startTime: string, endTime: string) {
  if (!startTime || !endTime) return "";
  const diffMs = Math.abs(new Date(endTime).getTime() - new Date(startTime).getTime());
  const minutes = Math.round(diffMs / (1000 * 60));
  if (minutes < 1) return "أقل من دقيقة";
  if (minutes === 1) return "دقيقة واحدة";
  if (minutes === 2) return "دقيقتان";
  if (minutes <= 10) return `${minutes} دقائق`;
  return `${minutes} دقيقة`;
}

function groupIntoSessions(history: any[] = []): GroupedSession[] {
  if (!history || history.length === 0) return [];

  // Sort descending by timestamp
  const sorted = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const rawGroups: any[][] = [];
  let currentGroup: any[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    currentGroup.push(current);

    const next = sorted[i + 1];
    if (next) {
      const currentTime = new Date(current.timestamp).getTime();
      const nextTime = new Date(next.timestamp).getTime();
      const diffMinutes = Math.abs(currentTime - nextTime) / (1000 * 60);

      if (diffMinutes >= 30) {
        rawGroups.push(currentGroup);
        currentGroup = [];
      }
    } else {
      rawGroups.push(currentGroup);
      currentGroup = [];
    }
  }

  const totalSessions = rawGroups.length;

  return rawGroups.map((group, idx) => {
    // Inside the session, sort ascending so the admin reads chronological narrative
    const sortedAsc = [...group].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return {
      sessionId: `session-${idx}-${sortedAsc[0]?.timestamp || idx}`,
      sessionIndex: totalSessions - idx,
      startTime: sortedAsc[0]?.timestamp || "",
      endTime: sortedAsc[sortedAsc.length - 1]?.timestamp || "",
      events: sortedAsc,
      hasPurchase: group.some((e) => e.type === "purchase"),
      hasAddToCart: group.some((e) => e.type === "add_to_cart"),
      hasCheckout: group.some((e) => e.type === "checkout"),
    };
  });
}

function CustomerDetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  const { data: customer, error, isLoading } = useSWR(
    id ? `/v1/admin/customers/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const sessions = useMemo(() => {
    if (!customer?.browsingHistory) return [];
    return groupIntoSessions(customer.browsingHistory);
  }, [customer?.browsingHistory]);

  // Expand the first (most recent) session by default
  useEffect(() => {
    if (sessions.length > 0) {
      const initial: Record<string, boolean> = {};
      sessions.forEach((s, idx) => {
        initial[s.sessionId] = idx === 0; // Most recent session expanded
      });
      setExpandedSessions(initial);
    }
  }, [sessions]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  if (!id) return <div className="p-8 text-center font-bold text-red-500">معرف العميل مفقود</div>;

  if (isLoading && !customer) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-100 rounded w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-4">
            <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto"></div>
            <div className="h-5 bg-slate-200 rounded w-36 mx-auto"></div>
            <div className="h-4 bg-slate-100 rounded w-24 mx-auto"></div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="h-12 bg-slate-50 rounded-2xl"></div>
              <div className="h-12 bg-slate-50 rounded-2xl"></div>
              <div className="h-12 bg-slate-50 rounded-2xl"></div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-48"></div>
            <div className="h-28 bg-slate-50 rounded-2xl"></div>
            <div className="h-28 bg-slate-50 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <User className="w-16 h-16 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-800">العميل غير موجود</h2>
        <Link href="/customers">
          <Button variant="outline">العودة للقائمة</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white border-slate-200"
          >
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            ملف العميل ورحلة الزيارات
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-mono">{customer.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -z-0 opacity-50"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm mb-4">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {customer.name || "زائر غير مسجل"}
              </h2>
              <p className="text-slate-500 text-sm mt-1" dir="ltr">
                {customer.phone || "-"}
              </p>

              <div className="flex items-center gap-1.5 mt-2">
                {customer.isGuest ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                    زائر مجهول (Guest)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    عميل مسجل
                  </span>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 w-full mt-5">
                <div className="bg-slate-50/80 rounded-2xl p-2.5 text-center border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block">الزيارات</span>
                    <span className="text-base font-bold text-blue-700 flex items-center justify-center gap-1 mt-0.5">
                    <Footprints className="w-3.5 h-3.5 text-blue-500" />
                    {Math.max(customer.visitsCount || 1, sessions.length || 1)}
                  </span>
                </div>
                <div className="bg-slate-50/80 rounded-2xl p-2.5 text-center border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block">الطلبات</span>
                  <span className="text-base font-bold text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                    {customer.totalOrders || 0}
                  </span>
                </div>
                <div className="bg-slate-50/80 rounded-2xl p-2.5 text-center border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block">المشتريات</span>
                  <span className="text-sm font-bold text-slate-800 block mt-0.5 truncate">
                    {(customer.totalSpent ?? 0).toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                بيانات التواصل
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs">رقم الجوال</span>
                    <span className="font-medium text-slate-800" dir="ltr">
                      {customer.phone || "غير متوفر"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs">البريد الإلكتروني</span>
                    <span className="font-medium text-slate-800">
                      {customer.email || "غير متوفر"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                معلومات الجهاز والمصدر
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs">عنوان IP</span>
                    <span className="font-medium text-slate-800 font-mono">
                      {customer.ipAddress || "-"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    {customer.device?.toLowerCase().includes("iphone") ||
                    customer.device?.toLowerCase().includes("galaxy") ||
                    customer.device?.toLowerCase().includes("mobile") ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Monitor className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs">الجهاز</span>
                    <span className="font-medium text-slate-800">
                      {customer.device || "غير محدد"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs">المصدر الأول (First Touch)</span>
                    <span className="font-medium text-slate-800">
                      {customer.source === "ai"
                        ? "ذكاء اصطناعي (AI)"
                        : customer.source === "referral"
                        ? "إحالة خارجية"
                        : customer.source === "direct"
                        ? "مباشر"
                        : customer.source === "tiktok"
                        ? "تيك توك"
                        : customer.source === "google"
                        ? "جوجل"
                        : customer.source === "facebook"
                        ? "فيسبوك"
                        : customer.source === "instagram"
                        ? "انستجرام"
                        : customer.source === "snapchat"
                        ? "سناب شات"
                        : customer.source || "مباشر"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs">أول زيارة</span>
                    <span className="font-medium text-slate-800 text-xs">
                      {formatArabicDate(customer.firstSeen)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Session Browsing Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  سجل الزيارات والنشاط الزمني
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  تتبع دقيق لما قام به العميل في كل زيارة منفصلة (نافذة 30 دقيقة من النشاط)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                  {sessions.length} جلسات مسجلة
                </span>
                <div className="bg-slate-50 p-2 rounded-xl flex items-center gap-1.5 text-xs text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>آخر ظهور: {formatArabicDate(customer.lastSeen)}</span>
                </div>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <Layers className="w-12 h-12 mx-auto text-slate-300" />
                <p className="font-medium text-sm">لا يوجد سجل تصفح مسجل لهذا العميل حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session, sIdx) => {
                  const isExpanded = !!expandedSessions[session.sessionId];
                  const isLatest = sIdx === 0;

                  return (
                    <div
                      key={session.sessionId}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isLatest
                          ? "border-blue-200 bg-blue-50/20 shadow-sm"
                          : "border-slate-200/80 bg-white hover:border-slate-300"
                      }`}
                    >
                      {/* Session Header Card */}
                      <button
                        type="button"
                        onClick={() => toggleSession(session.sessionId)}
                        className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right bg-transparent hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isLatest
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            #{session.sessionIndex}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">
                                {isLatest ? "الزيارة الحالية (الأحدث)" : `الزيارة رقم #${session.sessionIndex}`}
                              </span>
                              {session.hasPurchase && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  إتمام طلب
                                </span>
                              )}
                              {session.hasAddToCart && !session.hasPurchase && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full flex items-center gap-1">
                                  <ShoppingBag className="w-3 h-3" />
                                  إضافة سلة
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>{formatArabicDate(session.startTime)}</span>
                              {session.startTime !== session.endTime && (
                                <>
                                  <span>•</span>
                                  <span>المدة: {formatDuration(session.startTime, session.endTime)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                            {session.events.length} تفاعلات
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Session Events Timeline */}
                      {isExpanded && (
                        <div className="px-4 pb-5 pt-2 border-t border-slate-100/80 bg-white">
                          <div className="relative pl-3 pr-6 sm:pr-7 border-r-2 border-slate-200/70 space-y-4 my-2">
                            {session.events.map((event, eIdx) => (
                              <div key={event.id || `${session.sessionId}-${eIdx}`} className="relative">
                                {/* Timeline Dot */}
                                <div className="absolute -right-[31px] sm:-right-[35px] top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center z-10 shadow-sm">
                                  <EventIcon type={event.type} />
                                </div>

                                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 hover:border-slate-200 transition-colors">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800 text-xs">
                                        <EventLabel type={event.type} />
                                      </span>
                                      {event.type === "purchase" && (
                                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">
                                          طلب ناجح
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-400 font-mono" dir="ltr">
                                      {event.timestamp
                                        ? new Date(event.timestamp).toLocaleTimeString("ar-EG", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                          })
                                        : "-"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-500 shrink-0">الصفحة:</span>
                                    <span className="font-semibold text-blue-600 truncate">
                                      {event.title}
                                    </span>
                                    <span
                                      className="text-[11px] text-slate-400 font-mono hidden md:inline-block truncate max-w-[240px]"
                                      dir="ltr"
                                    >
                                      {event.path}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetailsPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center font-bold text-slate-500">جاري التحميل...</div>}
    >
      <CustomerDetailsContent />
    </Suspense>
  );
}
