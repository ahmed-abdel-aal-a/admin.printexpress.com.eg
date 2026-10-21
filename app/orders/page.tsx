"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import useSWR from "swr";
import { useDebounce } from "@/hooks/useDebounce";

import toast from "react-hot-toast";
import { rawFetcher as fetcher, getAuthToken, API_BASE_URL } from "@/lib/api";

import {
  Search,
  ListFilter,
  Download,
  Loader2,
  MoreVertical,
  Printer,
  Eye,
  Clock,
  AlertCircle,
  PackageSearch,
  ChevronDown,
  Calendar,
  CreditCard,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Order, OrderStatus } from "./types/order.types";
import { STATUS_TABS } from "./constants/order.constants";
import { PlusIcon, PaymentBadge, OrderDetailsModal, CreateOrderModal } from "./components";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconMap } from "@/lib/icon-map";

function OrderStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    pending_price_confirmation: {
      label: "بانتظار السعر",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    needs_action: {
      label: "تحتاج إجراء",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    },
    pending: {
      label: "تحتاج إجراء",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    },
    confirmed: {
      label: "تم التأكيد",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    processing: {
      label: "قيد التنفيذ",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    shipped: {
      label: "تم الشحن",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    completed: {
      label: "مكتمل",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    delivered: {
      label: "مكتمل",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    cancelled: {
      label: "ملغي",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    refunded: {
      label: "مسترد",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    trash: {
      label: "المهملات",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
  };

  const config = configs[status] || {
    label: status,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border", config.className)}>
      {config.label}
    </span>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("needs_action");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  // Reset page when tab, search, or filters change
  const [prevFilterKey, setPrevFilterKey] = useState(`${activeTab}-${debouncedSearch}-${dateFilter}-${paymentFilter}`);
  const currentFilterKey = `${activeTab}-${debouncedSearch}-${dateFilter}-${paymentFilter}`;
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setPage(1);
  }

  const { data: summaryData, mutate: mutateSummary } = useSWR(
    `/v1/admin/orders/summary?search=${encodeURIComponent(debouncedSearch || '')}&date=${encodeURIComponent(dateFilter || '')}&payment=${encodeURIComponent(paymentFilter || '')}`,
    fetcher
  );

  const orderCounts = useMemo(() => {
    const counts = {} as Record<OrderStatus, number>;
    STATUS_TABS.forEach(tab => {
      counts[tab.id] = summaryData?.[tab.id] || 0;
    });
    return counts;
  }, [summaryData]);

  const { data: ordersData, isLoading, mutate: mutateOrders } = useSWR(
    `/v1/admin/orders?page=${page}&status=${encodeURIComponent(activeTab || '')}&search=${encodeURIComponent(debouncedSearch || '')}&date=${encodeURIComponent(dateFilter || '')}&payment=${encodeURIComponent(paymentFilter || '')}`,
    fetcher
  );

  const displayOrders = useMemo(() => {
    const data = (ordersData?.data || []) as any[];
    return data.map((order: any) => ({
      ...order,
      db_id: order.id,
      id: order.order_number || order.id,
      customerName: order.customer_name || order.customerName,
      customerPhone: order.customer_phone || order.customerPhone,
      itemsCount: order.items_count || order.itemsCount,
      paymentStatus: order.payment_status || order.paymentStatus,
      shippingCompany: order.shipping_company || order.shippingCompany,
      trackingNumber: order.tracking_number || order.trackingNumber,
      shippingAddress: order.shipping_address || order.shippingAddress,
      date: order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB') : order.date,
    })) as Order[];
  }, [ordersData]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const token = getAuthToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || "http://localhost:2080/api";
      const params = new URLSearchParams({
        status: activeTab || '',
        search: debouncedSearch || '',
        date: dateFilter || '',
        payment: paymentFilter || ''
      });

      const res = await fetch(`${apiUrl}/v1/admin/orders/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/csv, application/json'
        }
      });

      if (!res.ok) {
        throw new Error('فشل تصدير الطلبات. يرجى التأكد من الصلاحيات.');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("تم تصدير ملف الطلبات بنجاح");
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تصدير ملف الطلبات');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              الطلبات
            </h1>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl">
              إدارة ومتابعة دورة حياة الطلبات من التأكيد إلى التسليم.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
              className="bg-white gap-2 flex-1 md:flex-none h-11 sm:h-10 rounded-xl sm:rounded-lg"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="font-medium">{isExporting ? "جاري التصدير..." : "تصدير"}</span>
            </Button>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-slate-900 text-white hover:bg-slate-800 gap-2 flex-1 md:flex-none shadow-md h-11 sm:h-10 rounded-xl sm:rounded-lg transition-transform active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="font-medium">طلب جديد</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats - Desktop */}
        <div className="hidden lg:grid grid-cols-4 gap-4">
          <StatCard
            title="إجمالي الطلبات"
            value={(summaryData?.total_orders || 0).toString()}
            trend="+12%"
            type="neutral"
          />
          <StatCard title="تحتاج إجراء" value={orderCounts["needs_action"].toString()} type="warning" />
          <StatCard title="مشحونة اليوم" value={(summaryData?.shipped_today || 0).toString()} type="info" />
          <StatCard
            title="المبيعات (ج.م)"
            value={(summaryData?.total_sales || 0).toLocaleString()}
            trend="+8%"
            type="success"
          />
        </div>

        {/* Quick Stats - Mobile */}
        <div className="lg:hidden">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full bg-white justify-between h-[52px] rounded-2xl border-orange-200 bg-orange-50/30 hover:bg-orange-50 text-orange-800 shadow-sm transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                    <AlertCircle className="w-4.5 h-4.5 text-orange-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm">تحتاج إجراء</span>
                    <span className="text-[10px] text-orange-600/80 font-medium">
                      عرض ملخص الإحصائيات
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    {orderCounts["needs_action"]}
                  </span>
                  <BarChart3 className="w-4 h-4 text-orange-400" />
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-slate-100">
              <DialogHeader className="bg-slate-50/50 pt-8 pb-4">
                <DialogTitle className="text-xl">
                  ملخص الطلبات والإحصائيات
                </DialogTitle>
              </DialogHeader>
              <div className="p-5 grid grid-cols-2 gap-3 bg-slate-50/30">
                <StatCard
                  title="إجمالي الطلبات"
                  value={(summaryData?.total_orders || 0).toString()}
                  trend="+12%"
                  type="neutral"
                />
                <StatCard title="تحتاج إجراء" value={orderCounts["needs_action"].toString()} type="warning" />
                <StatCard title="مشحونة اليوم" value={(summaryData?.shipped_today || 0).toString()} type="info" />
                <StatCard
                  title="المبيعات"
                  value={(summaryData?.total_sales || 0).toLocaleString()}
                  trend="+8%"
                  type="success"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Tabs - Desktop */}
          <div className="hidden lg:block border-b border-slate-100 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex p-2 sm:p-3 min-w-max gap-1 sm:gap-2">
              {STATUS_TABS.map((tab) => {
                const isActive = activeTab === tab.id;

                const Icon = IconMap[tab.iconName];
                const tabCount = orderCounts[tab.id];

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none",
                      isActive
                        ? "bg-slate-900 text-white shadow-md ring-1 ring-slate-900/10"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isActive ? "text-slate-300" : "text-slate-400",
                      )}
                    />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    <span
                      className={cn(
                        "flex items-center justify-center text-[10px] font-bold px-1.5 min-w-[20px] h-5 rounded-full transition-colors",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                      )}
                    >
                      {tabCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabs - Mobile (Select) */}
          <div className="lg:hidden p-4 border-b border-slate-100 bg-slate-50/30">
            <Select
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as OrderStatus)}
            >
              <SelectTrigger className="w-full bg-white h-12 text-sm font-bold shadow-sm border-slate-200">
                <SelectValue placeholder="اختر حالة الطلب" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {STATUS_TABS.map((tab) => {
                  const Icon = IconMap[tab.iconName];
                  const tabCount = orderCounts[tab.id];

                  return (
                    <SelectItem
                      key={tab.id}
                      value={tab.id}
                      className="text-sm font-semibold py-3"
                    >
                      <div className="flex items-center justify-between w-full pr-1">
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn("w-4 h-4", tab.color.split(" ")[0])}
                          />
                          <span>{tab.label}</span>
                        </div>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full mr-4">
                          {tabCount}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Filters & Actions bar */}
          <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 items-center justify-between bg-white">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="ابحث برقم الطلب، اسم العميل..."
                className="pl-4 pr-10 bg-white border-slate-200 shadow-sm w-full h-11 sm:h-10 focus-visible:ring-slate-400 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1 lg:pb-0">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-10 sm:h-9 gap-2 bg-white rounded-xl sm:rounded-lg whitespace-nowrap border-slate-200 min-w-[120px]">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <SelectValue placeholder="التاريخ" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">كل الأوقات</SelectItem>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="year">هذا العام</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="h-10 sm:h-9 gap-2 bg-white rounded-xl sm:rounded-lg whitespace-nowrap border-slate-200 min-w-[120px]">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <SelectValue placeholder="الدفع" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="paid">مدفوع بالكامل</SelectItem>
                  <SelectItem value="partially_paid">عربون مدفوع</SelectItem>
                  <SelectItem value="unpaid">غير مدفوع</SelectItem>
                  <SelectItem value="cod">الدفع عند الاستلام</SelectItem>
                  <SelectItem value="refunded">مسترد</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="h-10 sm:h-9 gap-2 bg-white rounded-xl sm:rounded-lg whitespace-nowrap border-slate-200 lg:hidden"
              >
                <ListFilter className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-700">تصفية</span>
              </Button>
            </div>
          </div>

          {/* Data Presentation */}
          <div className="flex-1 overflow-auto bg-slate-50/30">
            {isLoading ? (
              <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>
            ) : displayOrders.length === 0 ? (
              <EmptyState searchQuery={searchQuery} onClearSearch={() => setSearchQuery("")} />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block w-full">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 rounded-tr-xl">رقم الطلب</th>
                        <th className="px-6 py-4">العميل</th>
                        <th className="px-6 py-4">التاريخ</th>
                        <th className="px-6 py-4">الحالة</th>
                        <th className="px-6 py-4">حالة الدفع</th>
                        <th className="px-6 py-4">الإجمالي</th>
                        {["shipped", "completed"].includes(activeTab) && (
                          <th className="px-6 py-4">الشحن</th>
                        )}
                        <th className="px-6 py-4 rounded-tl-xl w-24">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayOrders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                              {order.id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">
                                {order.customerName}
                              </span>
                              <span
                                className="text-xs text-slate-500 mt-0.5"
                                dir="ltr"
                              >
                                {order.customerPhone}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-xs">{order.date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <PaymentBadge status={order.paymentStatus} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">
                                {order.total.toLocaleString()} ج.م
                              </span>
                              {(order as any).payment_type === 'deposit' && (
                                <span className="text-[10px] text-blue-600 font-bold">
                                  عربون: {Number((order as any).deposit_amount ?? 0).toLocaleString()} ج.م
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {order.itemsCount} منتجات
                              </span>
                            </div>
                          </td>
                          {["shipped", "completed"].includes(activeTab) && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-700 text-xs">
                                  {order.shippingCompany || "-"}
                                </span>
                                <span className="text-[10px] text-blue-600 font-mono mt-0.5">
                                  {order.trackingNumber || ""}
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedOrder(order)}
                                className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {displayOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-base">
                              {order.id}
                            </span>
                            <OrderStatusBadge status={order.status} />
                            <PaymentBadge status={order.paymentStatus} />
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">
                              {order.date}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mt-1 -mr-2 text-slate-400 hover:text-slate-900 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50/80 rounded-2xl p-3 mb-4 border border-slate-100/50">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 font-bold text-sm">
                          {order.customerName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {order.customerName}
                          </p>
                          <p
                            className="text-xs text-slate-500 mt-0.5 truncate"
                            dir="ltr"
                          >
                            {order.customerPhone}
                          </p>
                        </div>
                      </div>

                      {["shipped", "completed"].includes(activeTab) &&
                        order.shippingCompany && (
                          <div className="mb-4 flex items-center justify-between border-y border-dashed border-slate-200 py-3">
                            <span className="text-xs font-medium text-slate-500">
                              الشحن عبر:{" "}
                              <span className="font-bold text-slate-800">
                                {order.shippingCompany}
                              </span>
                            </span>
                            <span className="text-xs text-indigo-600 font-mono bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                              {order.trackingNumber}
                            </span>
                          </div>
                        )}

                      <div className="flex items-end justify-between pt-1">
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                            الإجمالي ({order.itemsCount} منتجات)
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className="font-black text-lg text-slate-900">
                              {order.total.toLocaleString()}{" "}
                              <span className="text-xs font-medium text-slate-500">
                                ج.م
                              </span>
                            </p>
                            {(order as any).payment_type === 'deposit' && (
                              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                                عربون: {Number((order as any).deposit_amount ?? 0).toLocaleString()} ج.م
                              </span>
                            )}
                          </div>
                        </div>
                        <Button onClick={() => setSelectedOrder(order)} className="bg-slate-900 text-white rounded-xl text-xs font-medium h-9 px-4 shadow-sm hover:bg-slate-800 transition-colors">
                          التفاصيل
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Pagination */}
          {ordersData?.last_page > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-sm text-slate-500 font-medium">
                صفحة {ordersData.current_page} من {ordersData.last_page}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border-slate-200"
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(ordersData.last_page, p + 1))}
                  disabled={page === ordersData.last_page}
                  className="rounded-lg border-slate-200"
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <OrderDetailsModal 
        order={selectedOrder} 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onOrderUpdated={() => {
          mutateSummary();
          mutateOrders();
        }}
      />
      <CreateOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
