"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  TooltipProps,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar as CalendarIcon,
  MapPin,
  Award,
  Loader2,
  RefreshCw,
  Printer,
  AlertCircle,
  Package,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";

const COLORS = ["#d97706", "#f59e0b", "#fbbf24", "#fcd34d", "#b45309"];

interface SalesPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface ProductReport {
  id: number;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  trend: string;
  isUp: boolean;
}

interface CustomerReport {
  id: number;
  name: string;
  email: string;
  orders: number;
  revenue: number;
  loyaltyTier: string;
}

interface CityReport {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  value: number;
  growth: string;
  isUp: boolean;
}

interface KPIMetric {
  value: number;
  trend: string;
  isUp: boolean;
}

interface ReportsResponse {
  sales: SalesPoint[];
  products: ProductReport[];
  cities: CityReport[];
  customers: CustomerReport[];
  kpis: {
    revenue: KPIMetric;
    orders: KPIMetric;
    avgOrderValue: KPIMetric;
    newCustomers: KPIMetric;
  };
}

// Custom Tooltip for Recharts
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string> & {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 text-right min-w-[170px]">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1.5">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm text-slate-600 flex items-center justify-between gap-3 my-1">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="font-medium">
                {entry.name === "revenue" ? "الإيرادات" : "الطلبات"}
              </span>
            </span>
            <span className="font-bold text-slate-900">
              {entry.name === "revenue" ? formatCurrency(entry.value) : entry.value.toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("year");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const {
    data: reportData,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<ReportsResponse>(
    `/v1/admin/dashboard/reports?range=${timeRange}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const rangeLabels: Record<string, string> = {
    today: "اليوم",
    week: "هذا الأسبوع",
    month: "هذا الشهر",
    year: "هذا العام",
  };

  const rangeSubtitles: Record<string, string> = {
    today: "تحليل الإيرادات والطلبات المسجلة اليوم",
    week: "تحليل الإيرادات والطلبات خلال هذا الأسبوع",
    month: "تحليل الإيرادات والطلبات خلال هذا الشهر",
    year: "تحليل الإيرادات والطلبات خلال هذا العام",
  };

  // Export CSV Handler with UTF-8 BOM & Excel separator directive
  const handleExportCSV = () => {
    if (!reportData) return;
    setIsExporting(true);

    try {
      const lines: string[] = [];
      const nowStr = new Date().toLocaleDateString("ar-EG") + " " + new Date().toLocaleTimeString("ar-EG");

      // Excel separator hint for standard sheet rendering
      lines.push("sep=,");
      // Header Meta
      lines.push("تقرير المبيعات والتحليلات - متجر Apex Store");
      lines.push(`الفترة المحددة,${rangeLabels[timeRange] || timeRange}`);
      lines.push(`تاريخ ووقت الاستخراج,${nowStr}`);
      lines.push("");

      // KPIs Section
      lines.push("--- المؤشرات المالية والتشغيلية الرئيسية (KPIs) ---");
      lines.push("المؤشر,القيمة,نسبة التغير السابقة");
      lines.push(`إجمالي الإيرادات,${reportData.kpis?.revenue?.value || 0} ج.م,${reportData.kpis?.revenue?.trend || "0%"}`);
      lines.push(`إجمالي الطلبات,${reportData.kpis?.orders?.value || 0},${reportData.kpis?.orders?.trend || "0%"}`);
      lines.push(`متوسط قيمة الطلب,${reportData.kpis?.avgOrderValue?.value || 0} ج.م,${reportData.kpis?.avgOrderValue?.trend || "0%"}`);
      lines.push(`العملاء الجدد,${reportData.kpis?.newCustomers?.value || 0},${reportData.kpis?.newCustomers?.trend || "0%"}`);
      lines.push("");

      // Sales Timeline
      lines.push("--- الخط الزمني للمبيعات ---");
      lines.push("الفترة / التاريخ,الإيرادات (ج.م),عدد الطلبات");
      (reportData.sales || []).forEach((s) => {
        lines.push(`"${s.label}",${s.revenue},${s.orders}`);
      });
      lines.push("");

      // Top Products
      lines.push("--- أفضل المنتجات مبيعاً ---");
      lines.push("المنتج,الفئة,الكمية المباعة,الإيرادات (ج.م)");
      (reportData.products || []).forEach((p) => {
        lines.push(`"${p.name.replace(/"/g, '""')}","${p.category || "عام"}",${p.sales},${p.revenue}`);
      });
      lines.push("");

      // Top Customers
      lines.push("--- أبرز العملاء تفاعلاً وإنفاقاً ---");
      lines.push("اسم العميل,رقم الجوال / البريد,عدد الطلبات,إجمالي الإنفاق (ج.م),فئة الولاء");
      (reportData.customers || []).forEach((c) => {
        lines.push(`"${c.name.replace(/"/g, '""')}","${c.email || "-"} ",${c.orders},${c.revenue},"${c.loyaltyTier || "برونزي"}"`);
      });
      lines.push("");

      // Cities
      lines.push("--- المبيعات الجغرافية حسب المدن ---");
      lines.push("المدينة,عدد الطلبات,إجمالي الإيرادات (ج.م),النسبة المئوية من الإجمالي");
      (reportData.cities || []).forEach((city) => {
        lines.push(`"${city.name}",${city.orders},${city.revenue},${city.value}%`);
      });

      const csvContent = "\uFEFF" + lines.join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fileName = `تقرير_المبيعات_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccessMessage(`تم تصدير التقرير بنجاح! تم حفظ (${fileName}) في التنزيلات.`);
      setTimeout(() => setExportSuccessMessage(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const KPIStats = reportData?.kpis
    ? [
        {
          id: "total-revenue",
          title: "إجمالي الإيرادات",
          value: formatCurrency(reportData.kpis.revenue.value),
          trend: reportData.kpis.revenue.trend,
          isUp: reportData.kpis.revenue.isUp,
          icon: DollarSign,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          id: "total-orders",
          title: "إجمالي الطلبات",
          value: reportData.kpis.orders.value.toLocaleString(),
          trend: reportData.kpis.orders.trend,
          isUp: reportData.kpis.orders.isUp,
          icon: ShoppingCart,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          id: "avg-order-value",
          title: "متوسط قيمة الطلب",
          value: formatCurrency(reportData.kpis.avgOrderValue.value),
          trend: reportData.kpis.avgOrderValue.trend,
          isUp: reportData.kpis.avgOrderValue.isUp,
          icon: TrendingUp,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          id: "new-customers",
          title: "العملاء الجدد",
          value: reportData.kpis.newCustomers.value.toLocaleString(),
          trend: reportData.kpis.newCustomers.trend,
          isUp: reportData.kpis.newCustomers.isUp,
          icon: Users,
          color: "text-purple-600",
          bg: "bg-purple-50",
        },
      ]
    : [];

  const totalSalesRevenue = (reportData?.sales || []).reduce((acc, curr) => acc + (curr.revenue || 0), 0);

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 sm:p-6 lg:p-8 font-sans relative" dir="rtl">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
            <Loader2 className="w-9 h-9 text-amber-500 animate-spin" />
            <span className="text-sm font-bold text-slate-700">جاري تحميل بيانات التقارير...</span>
          </div>
        </div>
      )}

      {/* Floating Success Notification for Export */}
      {exportSuccessMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-700 transition-all animate-in fade-in slide-in-from-bottom-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{exportSuccessMessage}</p>
            <p className="text-xs text-slate-400">يمكنك فتح الملف مباشرة عبر Microsoft Excel أو Google Sheets.</p>
          </div>
          <button
            onClick={() => setExportSuccessMessage(null)}
            className="text-slate-400 hover:text-white mr-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">
            التقارير التحليلية
          </h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">
            {rangeSubtitles[timeRange] || "نظرة شاملة على أداء المبيعات والمنتجات"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto print:hidden">
          {/* Time Range Selector */}
          <div className="relative group flex-1 sm:flex-none">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm cursor-pointer"
            >
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="year">هذا العام</option>
            </select>
            <CalendarIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            title="تحديث البيانات"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-200 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isValidating && "animate-spin text-amber-500")} />
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            title="طباعة التقرير"
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl shadow-sm transition-all hidden md:flex items-center justify-center"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Export CSV / Excel Button */}
          <button
            onClick={handleExportCSV}
            disabled={!reportData || isExporting}
            className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white py-2.5 px-5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>تصدير التقرير (Excel)</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-rose-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-semibold">
              حدث خطأ أثناء استرجاع بيانات التقرير. يرجى التأكد من اتصال الخادم.
            </span>
          </div>
          <button
            onClick={() => mutate()}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {reportData && (
        <>
          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {KPIStats.map((stat) => (
              <div
                key={stat.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                      stat.isUp
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-rose-700 bg-rose-50"
                    )}
                  >
                    {stat.isUp ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    {stat.value}
                  </h3>
                </div>
                {/* Decorative background accent */}
                <div
                  className={cn(
                    "absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-2xl",
                    stat.color.replace("text-", "bg-")
                  )}
                />
              </div>
            ))}
          </div>

          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    إيرادات المبيعات
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    {rangeSubtitles[timeRange]}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-slate-600 text-xs font-semibold">الإيرادات المحققة</span>
                  </div>
                  {totalSalesRevenue === 0 && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                      لا توجد مبيعات في هذه الفترة
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart
                    data={reportData.sales}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                      dx={-5}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                        return `${value}`;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      activeDot={{ r: 6, fill: "#b45309", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by City */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  المبيعات حسب المدينة
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm font-medium">
                  توزيع المبيعات في أبرز المناطق الجغرافية
                </p>
              </div>

              {reportData.cities && reportData.cities.length > 0 ? (
                <div className="flex-1 flex flex-col justify-center min-h-[250px]">
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie
                        data={reportData.cities}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {reportData.cities.map((entry, index: number) => (
                          <Cell
                            key={entry.id || index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}%`, "النسبة"]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          fontWeight: "bold",
                          textAlign: "right",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 border-t border-slate-50 pt-4">
                    {reportData.cities.map((city, index: number) => (
                      <div key={city.id || index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                          {city.name}
                        </span>
                        <span className="text-xs text-slate-400 mr-auto font-mono">
                          {city.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <MapPin className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                  <p className="text-sm font-medium">لا توجد بيانات جغرافية للطلبات بعد</p>
                </div>
              )}
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products - Full Width on Large */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    أفضل المنتجات مبيعاً
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    قائمة بالمنتجات الأكثر طلباً وتحقيقاً للإيرادات
                  </p>
                </div>
                <Link
                  href="/products"
                  className="text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors flex items-center gap-1"
                >
                  <span>عرض كل المنتجات</span>
                  <span>&larr;</span>
                </Link>
              </div>

              {reportData.products && reportData.products.length > 0 ? (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs sm:text-sm">
                        <th className="pb-3 px-3 font-semibold text-right whitespace-nowrap">المنتج</th>
                        <th className="pb-3 px-3 font-semibold text-right whitespace-nowrap">الفئة</th>
                        <th className="pb-3 px-3 font-semibold text-center whitespace-nowrap">المبيعات</th>
                        <th className="pb-3 px-3 font-semibold text-center whitespace-nowrap">الإيرادات</th>
                        <th className="pb-3 px-3 font-semibold text-left whitespace-nowrap">التوجه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reportData.products.map((product) => (
                        <tr
                          key={product.id}
                          className="hover:bg-slate-50/60 transition-colors group"
                        >
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-slate-800 text-sm truncate max-w-[220px]">
                                {product.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500 text-xs sm:text-sm font-medium whitespace-nowrap">
                            {product.category || "عام"}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700 text-sm whitespace-nowrap">
                            {product.sales.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-900 text-sm whitespace-nowrap">
                            {formatCurrency(product.revenue)}
                          </td>
                          <td className="py-3 px-3 text-left whitespace-nowrap">
                            <div
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
                                product.isUp
                                  ? "text-emerald-700 bg-emerald-50"
                                  : "text-rose-700 bg-rose-50"
                              )}
                            >
                              {product.isUp ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {product.trend}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 stroke-1 text-slate-300" />
                  <p className="text-sm font-medium">لا توجد مبيعات منتجات مسجلة في هذه الفترة</p>
                </div>
              )}
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    أفضل العملاء
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    العملاء الأكثر ولاءً وتكراراً للشراء
                  </p>
                </div>
                <Link
                  href="/customers"
                  className="text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors flex items-center gap-1"
                >
                  <span>عرض كل العملاء</span>
                  <span>&larr;</span>
                </Link>
              </div>

              {reportData.customers && reportData.customers.length > 0 ? (
                <div className="overflow-x-auto custom-scrollbar flex-1">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs sm:text-sm">
                        <th className="pb-3 px-2 font-semibold text-right whitespace-nowrap">العميل</th>
                        <th className="pb-3 px-2 font-semibold text-center whitespace-nowrap">الطلبات</th>
                        <th className="pb-3 px-2 font-semibold text-center whitespace-nowrap">الإنفاق</th>
                        <th className="pb-3 px-2 font-semibold text-left whitespace-nowrap">الولاء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reportData.customers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3.5 px-2 text-right">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {customer.name ? customer.name.charAt(0) : "ع"}
                              </div>
                              <div className="min-w-0 max-w-[130px] sm:max-w-[160px]">
                                <p className="font-bold text-slate-800 text-sm truncate" title={customer.name}>
                                  {customer.name}
                                </p>
                                <p className="text-xs text-slate-400 truncate" dir="ltr">
                                  {customer.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-2 text-center font-semibold text-slate-700 text-sm whitespace-nowrap">
                            {customer.orders}
                          </td>
                          <td className="py-3.5 px-2 text-center font-bold text-slate-900 text-sm whitespace-nowrap">
                            {formatCurrency(customer.revenue)}
                          </td>
                          <td className="py-3.5 px-2 text-left whitespace-nowrap">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200/50">
                              <Award className="w-3.5 h-3.5 text-amber-600" />
                              <span>{customer.loyaltyTier}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <Users className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                  <p className="text-sm font-medium">لا توجد طلبات عملاء مسجلة في هذه الفترة</p>
                </div>
              )}
            </div>

            {/* Top Cities Detailed */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    أداء المدن
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    تفصيل أداء المبيعات حسب الموقع الجغرافي
                  </p>
                </div>
                <Link
                  href="/orders"
                  className="text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors flex items-center gap-1"
                >
                  <span>عرض الطلبات</span>
                  <span>&larr;</span>
                </Link>
              </div>

              {reportData.cities && reportData.cities.length > 0 ? (
                <div className="overflow-x-auto custom-scrollbar flex-1">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs sm:text-sm">
                        <th className="pb-3 px-2 font-semibold text-right whitespace-nowrap">المدينة</th>
                        <th className="pb-3 px-2 font-semibold text-center whitespace-nowrap">الطلبات</th>
                        <th className="pb-3 px-2 font-semibold text-center whitespace-nowrap">الإيرادات</th>
                        <th className="pb-3 px-2 font-semibold text-left whitespace-nowrap">الحصة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reportData.cities.map((city, index: number) => (
                        <tr
                          key={city.id || index}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3.5 px-2 text-right">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{city.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-2 text-center font-semibold text-slate-700 text-sm whitespace-nowrap">
                            {city.orders.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-2 text-center font-bold text-slate-900 text-sm whitespace-nowrap">
                            {formatCurrency(city.revenue)}
                          </td>
                          <td className="py-3.5 px-2 text-left whitespace-nowrap">
                            <div className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/50">
                              {city.value}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <MapPin className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                  <p className="text-sm font-medium">لا توجد بيانات مدن مسجلة للطلبات بعد</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
