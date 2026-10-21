"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Save, Ticket, Sparkles, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import useSWR from "swr";
import { rawFetcher, apiClient } from "@/lib/api";

function CouponFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);

  // Form Fields
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState<string>("");
  const [minOrderAmount, setMinOrderAmount] = useState<string>("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [usagePerUser, setUsagePerUser] = useState<string>("1");
  const [applyToSaleItems, setApplyToSaleItems] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Fetch initial data if editing
  const { data: couponData, error } = useSWR(
    isEdit ? `/v1/admin/coupons/${id}` : null,
    rawFetcher
  );

  useEffect(() => {
    if (couponData) {
      setCode(couponData.code || "");
      setType(couponData.type || "percentage");
      setValue(couponData.value ? String(Number(couponData.value)) : "");
      setMinOrderAmount(couponData.min_order_amount ? String(Number(couponData.min_order_amount)) : "");
      setMaxDiscountAmount(couponData.max_discount_amount ? String(Number(couponData.max_discount_amount)) : "");
      setUsageLimit(couponData.usage_limit ? String(couponData.usage_limit) : "");
      setUsagePerUser(couponData.usage_per_user ? String(couponData.usage_per_user) : "1");
      setApplyToSaleItems(couponData.apply_to_sale_items ?? true);
      setStartDate(couponData.start_date ? couponData.start_date.split(/[T ]/)[0] : "");
      setExpiresAt(couponData.expires_at ? couponData.expires_at.split(/[T ]/)[0] : "");
      setIsActive(couponData.is_active ?? true);
    }
  }, [couponData]);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "APEX-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("يرجى إدخال كود الخصم");
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error("يرجى إدخال قيمة خصم صالحة");
      return;
    }

    if (type === "percentage" && numValue > 100) {
      toast.error("نسبة الخصم المئوية لا يمكن أن تتجاوز 100%");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        code: cleanCode,
        type,
        value: numValue,
        min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        max_discount_amount: type === "percentage" && maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
        usage_per_user: usagePerUser ? parseInt(usagePerUser, 10) : null,
        apply_to_sale_items: applyToSaleItems,
        start_date: startDate ? `${startDate} 00:00:00` : null,
        expires_at: expiresAt ? `${expiresAt} 23:59:59` : null,
        is_active: isActive,
      };

      if (isEdit) {
        await apiClient(`/v1/admin/coupons/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("تم تحديث كود الخصم بنجاح");
      } else {
        await apiClient(`/v1/admin/coupons`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("تم إنشاء كود الخصم بنجاح");
      }

      router.push("/coupons");
    } catch (err: any) {
      let msg = err.message || "حدث خطأ أثناء حفظ الكود";
      if (err.data?.errors) {
        const firstErr = Object.values(err.data.errors)[0] as any;
        if (Array.isArray(firstErr)) msg = firstErr[0];
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Back button */}
      <Link
        href="/coupons"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-6 transition-colors"
      >
        <ArrowRight size={18} /> العودة لقائمة الكوبونات
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Ticket className="text-amber-600" size={30} />
            {isEdit ? "تعديل كود الخصم" : "إضافة كود خصم جديد"}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {isEdit ? "تعديل الشروط والحدود الحالية للكود" : "تحديد شروط وقيمة وصلاحية كود الخصم"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Code & Basic Values */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
            البيانات الأساسية لكود الخصم
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                كود الخصم (Coupon Code) <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
                  placeholder="مثال: SUMMER2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold uppercase tracking-wider text-slate-900 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                  title="توليد كود عشوائي"
                >
                  <Sparkles size={16} /> توليد
                </button>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                نوع الخصم <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              >
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ج.م)</option>
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                قيمة الخصم <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={type === "percentage" ? 100 : undefined}
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "percentage" ? "مثال: 20" : "مثال: 50"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400">
                  {type === "percentage" ? "%" : "ج.م"}
                </span>
              </div>
            </div>

            {/* Max Discount Amount (Only for percentage) */}
            {type === "percentage" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  الحد الأقصى لمبلغ الخصم (ج.م)
                  <span className="text-xs font-normal text-slate-400 mr-2">(اختياري)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="مثال: 200 (اتركه فارغاً لخصم مفتوح)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Min Order Amount */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                الحد الأدنى لقيمة الطلب (ج.م)
                <span className="text-xs font-normal text-slate-400 mr-2">(اختياري)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="مثال: 100 (اتركه فارغاً لأي طلب)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Usage Restrictions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
            قيود الاستخدام والعملاء
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total usage limit */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                الحد الأقصى الإجمالي للاستخدام (كافة العملاء)
                <span className="text-xs font-normal text-slate-400 mr-2">(اختياري)</span>
              </label>
              <input
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="مثال: 50 (اتركه فارغاً لعدد غير محدود)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Per user limit */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                الحد الأقصى لكل عميل (برقم الهاتف أو الحساب)
              </label>
              <input
                type="number"
                min="1"
                value={usagePerUser}
                onChange={(e) => setUsagePerUser(e.target.value)}
                placeholder="افتراضي: 1 مرة لكل عميل"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Apply to sale items toggle */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
              <div>
                <span className="block font-bold text-slate-800 text-sm">
                  تطبيق الخصم على المنتجات المخفضة (Sale Items)
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  إذا قمت بإلغاء التفعيل، سيتم استثناء أي منتجات ذات سعر مخفض من احتساب الخصم ومن فحص الحد الأدنى للطلب.
                </span>
              </div>
              <input
                type="checkbox"
                checked={applyToSaleItems}
                onChange={(e) => setApplyToSaleItems(e.target.checked)}
                className="w-5 h-5 accent-amber-600 mt-1 cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Validity Dates & Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
            تاريخ الصلاحية وحالة التفعيل
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start date */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                تاريخ بداية السريان (Start Date)
                <span className="text-xs font-normal text-slate-400 mr-2">(اختياري)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Expiration date */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                تاريخ انتهاء الصلاحية (Expiration Date)
                <span className="text-xs font-normal text-slate-400 mr-2">(اختياري)</span>
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Is Active Toggle */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="block font-bold text-slate-800 text-sm">
                  تفعيل كود الخصم فوراً
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  في حالة التعطيل، لن يتمكن أي عميل من استخدام الكود حتى يتم تفعيله.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 accent-amber-600 cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/coupons"
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إنشاء الكوبون"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CouponFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">جاري التحميل...</div>}>
      <CouponFormContent />
    </Suspense>
  );
}
