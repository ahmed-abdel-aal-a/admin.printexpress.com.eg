"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Ticket, Copy, Check, Search, Filter } from "lucide-react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format, isBefore, isAfter } from "date-fns";
import { ar } from "date-fns/locale";
import { rawFetcher, apiClient } from "@/lib/api";

export default function CouponsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Build query URL
  let queryUrl = `/v1/admin/coupons?page=${page}`;
  if (search.trim()) queryUrl += `&search=${encodeURIComponent(search.trim())}`;
  if (activeFilter !== "all") queryUrl += `&is_active=${activeFilter}`;
  if (typeFilter !== "all") queryUrl += `&type=${typeFilter}`;

  const { data: response, error, mutate } = useSWR(queryUrl, rawFetcher);
  const coupons = response?.data;
  const lastPage = response?.last_page || 1;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`تم نسخ الكود: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (id: number) => {
    try {
      const res = await apiClient(`/v1/admin/coupons/${id}/toggle-active`, { method: "PATCH" });
      toast.success(res.message || "تم تغيير حالة الكود بنجاح");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "فشل تغيير حالة الكود");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكوبون؟ لن يتمكن العملاء من استخدامه بعد الآن.")) return;

    setIsDeleting(id);
    try {
      await apiClient(`/v1/admin/coupons/${id}`, { method: "DELETE" });
      toast.success("تم حذف الكوبون بنجاح");
      mutate();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(null);
    }
  };

  const getValidityBadge = (coupon: any) => {
    const now = new Date();
    if (coupon.start_date && isBefore(now, new Date(coupon.start_date))) {
      return <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">لم يبدأ بعد</span>;
    }
    if (coupon.expires_at && isAfter(now, new Date(coupon.expires_at))) {
      return <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-bold">منتهي الصلاحية</span>;
    }
    return <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold">سارٍ الآن</span>;
  };

  if (error) return <div className="p-8 text-red-500 font-bold">حدث خطأ في تحميل كوبونات الخصم</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Ticket className="text-amber-600" size={32} />
            إدارة كوبونات الخصم
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            إنشاء والتحكم في أكواد الخصم الترويجية وشروط الاستخدام وحدود الطلب
          </p>
        </div>
        <Link
          href="/coupons/form"
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-200 flex items-center gap-2"
        >
          <Plus size={20} /> إضافة كود خصم جديد
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="بحث بكود الخصم..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm focus:outline-none focus:border-amber-500 font-medium"
          />
          <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="all">كل الأنواع</option>
            <option value="percentage">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت (ج.م)</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="all">كل الحالات</option>
            <option value="1">مفعّل</option>
            <option value="0">معطّل</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wide">
                <th className="p-4 whitespace-nowrap">الكود</th>
                <th className="p-4 whitespace-nowrap">قيمة الخصم</th>
                <th className="p-4 whitespace-nowrap">الحد الأدنى للطلب</th>
                <th className="p-4 whitespace-nowrap">الاستهلاك / الحد</th>
                <th className="p-4 whitespace-nowrap">لكل عميل</th>
                <th className="p-4 whitespace-nowrap">المنتجات المخفضة</th>
                <th className="p-4 whitespace-nowrap">الصلاحية</th>
                <th className="p-4 whitespace-nowrap">الحالة</th>
                <th className="p-4 whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {!coupons ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">جاري التحميل...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-bold text-lg">
                    لا توجد كوبونات خصم تطابق البحث
                  </td>
                </tr>
              ) : (
                coupons.map((coupon: any) => (
                  <tr key={coupon.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code */}
                    <td className="p-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg tracking-wider text-sm">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopy(coupon.code)}
                          className="text-slate-400 hover:text-amber-600 transition-colors"
                          title="نسخ الكود"
                        >
                          {copiedCode === coupon.code ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="p-4 font-bold text-slate-800 whitespace-nowrap">
                      {coupon.type === "percentage" ? (
                        <div>
                          <span className="text-amber-600">{Number(coupon.value)}%</span>
                          {coupon.max_discount_amount && (
                            <div className="text-xs text-slate-400 font-normal">
                              أقصى خصم: {Number(coupon.max_discount_amount)} ج.م
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-emerald-600">{Number(coupon.value).toFixed(2)} ج.م</span>
                      )}
                    </td>

                    {/* Min order amount */}
                    <td className="p-4 text-slate-600 whitespace-nowrap font-medium">
                      {coupon.min_order_amount ? `${Number(coupon.min_order_amount).toFixed(2)} ج.م` : "بدون حد"}
                    </td>

                    {/* Usage count */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{coupon.times_used}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500 font-medium">
                          {coupon.usage_limit !== null ? coupon.usage_limit : "∞"}
                        </span>
                      </div>
                      {coupon.usage_limit && (
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              coupon.times_used >= coupon.usage_limit ? "bg-rose-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(100, (coupon.times_used / coupon.usage_limit) * 100)}%` }}
                          />
                        </div>
                      )}
                    </td>

                    {/* Per user limit */}
                    <td className="p-4 text-slate-600 whitespace-nowrap font-medium">
                      {coupon.usage_per_user ? `${coupon.usage_per_user} مرة` : "غير محدود"}
                    </td>

                    {/* Apply to sale items */}
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          coupon.apply_to_sale_items
                            ? "bg-slate-100 text-slate-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {coupon.apply_to_sale_items ? "تشمل المخفض" : "تستثني المخفض"}
                      </span>
                    </td>

                    {/* Validity */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {getValidityBadge(coupon)}
                        {coupon.expires_at && (
                          <span className="text-[11px] text-slate-400">
                            حتى: {format(new Date(coupon.expires_at), "yyyy/MM/dd", { locale: ar })}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Active toggle */}
                    <td className="p-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(coupon.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          coupon.is_active ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                        title="تغيير حالة التفعيل"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            coupon.is_active ? "translate-x-1" : "translate-x-6"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/coupons/form?id=${coupon.id}`}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          disabled={isDeleting === coupon.id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm font-medium text-slate-600">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
            >
              السابق
            </button>
            <span>
              صفحة {page} من {lastPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
