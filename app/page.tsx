"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Clock,
  RefreshCw,
  Eye,
  CreditCard,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

// Arabic status badge mapping
const getOrderStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return {
        label: "قيد الانتظار",
        className: "bg-amber-50 text-amber-800 border-amber-200/80",
        dot: "bg-amber-500",
      };
    case "processing":
      return {
        label: "جاري التجهيز",
        className: "bg-blue-50 text-blue-800 border-blue-200/80",
        dot: "bg-blue-500",
      };
    case "shipped":
      return {
        label: "تم الشحن",
        className: "bg-purple-50 text-purple-800 border-purple-200/80",
        dot: "bg-purple-500",
      };
    case "delivered":
    case "completed":
      return {
        label: "مكتمل",
        className: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
        dot: "bg-emerald-500",
      };
    case "cancelled":
      return {
        label: "ملغي",
        className: "bg-rose-50 text-rose-800 border-rose-200/80",
        dot: "bg-rose-500",
      };
    default:
      return {
        label: status || "قيد المعالجة",
        className: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
      };
  }
};

const getPaymentMethodBadge = (method: string, status: string) => {
  const isPaid = status === "paid";
  const label = method === "cod" ? "عند الاستلام" : "إلكتروني";
  return {
    label,
    className: isPaid
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-50 text-slate-600 border-slate-200",
  };
};

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const {
    data: summary,
    isLoading,
    isValidating,
    error,
    mutate,
  } = useSWR("/v1/admin/dashboard/summary", fetcher, {
    revalidateOnFocus: true,
  });

  const stats = [
    {
      name: "إجمالي المبيعات",
      value: formatCurrency(summary?.total_sales),
      change: summary?.total_sales_trend || "+100%",
      isUp: summary?.is_sales_up ?? true,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      name: "المبيعات الشهرية",
      value: formatCurrency(summary?.monthly_sales),
      change: summary?.monthly_sales_trend || "+100%",
      isUp: summary?.is_monthly_sales_up ?? true,
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      name: "الطلبات",
      value: (summary?.total_orders || 0).toLocaleString(),
      change: summary?.total_orders_trend || "+100%",
      isUp: summary?.is_orders_up ?? true,
      icon: ShoppingCart,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      name: "العملاء المتفاعلون",
      value: (summary?.new_customers || 0).toLocaleString(),
      change: summary?.new_customers_trend || "+100%",
      isUp: summary?.is_customers_up ?? true,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>مرحباً بعودتك، {user?.name || "مدير النظام"}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            إليك نظرة سريعة ومباشرة على أداء متجرك ومبيعاتك اليوم.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            title="تحديث البيانات لحظياً"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-amber-600 hover:border-amber-200 rounded-xl shadow-sm transition-all text-xs font-bold disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isValidating && "animate-spin text-amber-500")} />
            <span>تحديث فوري</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                  <Icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border",
                    stat.isUp
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200/60"
                      : "text-rose-700 bg-rose-50 border-rose-200/60"
                  )}
                >
                  {stat.isUp ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 tracking-wider mb-1">
                  {stat.name}
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                  {isLoading ? (
                    <span className="inline-block w-24 h-7 bg-slate-100 animate-pulse rounded-lg"></span>
                  ) : (
                    stat.value
                  )}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Orders (Large) + Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">أحدث الطلبات</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {summary?.recent_orders?.length || 0} طلبات
              </span>
            </div>
            <Link
              href="/orders"
              className="text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 group"
            >
              <span>عرض كل الطلبات</span>
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>

          <div className="overflow-x-auto custom-scrollbar flex-1">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-sm font-semibold">جاري جلب أحدث الطلبات...</span>
              </div>
            ) : summary?.recent_orders?.length > 0 ? (
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold">
                    <th className="pb-3 px-3 text-right whitespace-nowrap">رقم الطلب</th>
                    <th className="pb-3 px-3 text-right whitespace-nowrap">العميل</th>
                    <th className="pb-3 px-3 text-center whitespace-nowrap">الإجمالي والدفع</th>
                    <th className="pb-3 px-3 text-center whitespace-nowrap">الحالة</th>
                    <th className="pb-3 px-3 text-left whitespace-nowrap">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {summary.recent_orders.map((order: any) => {
                    const statusBadge = getOrderStatusBadge(order.status);
                    const paymentBadge = getPaymentMethodBadge(order.payment_method, order.payment_status);

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Order Number */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <Link
                            href={`/orders`}
                            className="inline-flex items-center gap-1.5 font-mono font-bold text-xs bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 border border-slate-200 hover:border-amber-300 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <span dir="ltr">{order.order_number}</span>
                          </Link>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {order.customer_name ? order.customer_name.charAt(0) : "ع"}
                            </div>
                            <div className="min-w-0 max-w-[140px] sm:max-w-[180px]">
                              <p className="font-bold text-slate-800 text-sm truncate" title={order.customer_name}>
                                {order.customer_name}
                              </p>
                              <p className="text-xs text-slate-400 truncate" dir="ltr">
                                {order.customer_phone || "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Total & Payment */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-slate-900 text-sm">
                              {formatCurrency(order.total)}
                            </span>
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border mt-0.5", paymentBadge.className)}>
                              {paymentBadge.label}
                            </span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border", statusBadge.className)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusBadge.dot)} />
                            <span>{statusBadge.label}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-left whitespace-nowrap">
                          <Link
                            href="/orders"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                            title="عرض الطلب"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center gap-2">
                <ShoppingCart className="w-8 h-8 text-slate-300 stroke-1" />
                <p className="font-medium">لا توجد طلبات مسجلة في المتجر حتى الآن</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              المنتجات الأكثر مبيعاً
            </h2>
            <Link
              href="/products"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
            >
              عرض الكل &larr;
            </Link>
          </div>

          <div className="space-y-3.5 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm">جاري التحميل...</div>
            ) : summary?.top_products?.length > 0 ? (
              summary.top_products.map((product: any, i: number) => (
                <div
                  key={product.id || i}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 max-w-[150px] sm:max-w-[170px]">
                      <h4 className="font-bold text-sm text-slate-800 truncate" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {product.category || "طباعة رقمية"}
                      </p>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-md inline-block">
                      {product.order_items_count > 0 ? `${product.order_items_count} مبيعات` : "الأكثر طلباً"}
                    </span>
                    {product.revenue > 0 && (
                      <p className="text-xs font-semibold text-slate-600 mt-1">
                        {formatCurrency(product.revenue)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2">
                <Package className="w-8 h-8 text-slate-300 stroke-1" />
                <p className="font-medium">لا توجد مبيعات للمنتجات بعد</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
