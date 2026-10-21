"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Save, Image as ImageIcon, CheckCircle, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import useSWR from "swr";
import { rawFetcher, apiClient } from "@/lib/api";
import { getBackendMediaUrl } from "@/lib/utils";

function OfferFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  
  // Data States
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Linkable States
  const [linkMode, setLinkMode] = useState<"none" | "product" | "category" | "printing_type" | "custom">("none");
  const [linkableId, setLinkableId] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  
  // Image States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data if edit
  const { data: offerData, error } = useSWR(isEdit ? `/v1/admin/offers/${id}` : null, rawFetcher);

  useEffect(() => {
    if (offerData) {
      setTitleAr(offerData.title?.ar || "");
      setTitleEn(offerData.title?.en || "");
      setDescAr(offerData.description?.ar || "");
      setDescEn(offerData.description?.en || "");
      setIsActive(offerData.is_active);
      setSortOrder(offerData.sort_order || 0);
      setStartDate(offerData.start_date ? offerData.start_date.split(/[T ]/)[0] : "");
      setEndDate(offerData.end_date ? offerData.end_date.split(/[T ]/)[0] : "");
      
      if (offerData.custom_url) {
        setLinkMode("custom");
        setCustomUrl(offerData.custom_url);
      } else if (offerData.linkable_type) {
        setLinkMode(offerData.linkable_type as any);
        setLinkableId(offerData.linkable_id?.toString() || "");
      } else {
        setLinkMode("none");
      }

      if (offerData.image_path) {
        const rawPath = typeof offerData.image_path === 'string' ? offerData.image_path : offerData.image_path.desktop;
        setImagePreview(getBackendMediaUrl(rawPath));
      }
    }
  }, [offerData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr || !titleEn) {
      toast.error("يرجى إدخال عنوان العرض باللغتين");
      return;
    }

    if (!isEdit && !imageFile) {
      toast.error("صورة العرض مطلوبة");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title[ar]', titleAr);
      formData.append('title[en]', titleEn);
      formData.append('description[ar]', descAr);
      formData.append('description[en]', descEn);
      formData.append('is_active', isActive ? "1" : "0");
      formData.append('sort_order', sortOrder.toString());
      
      if (startDate) formData.append('start_date', startDate);
      if (endDate) formData.append('end_date', endDate);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // Linkable Logic
      if (linkMode === "custom") {
        formData.append('custom_url', customUrl);
      } else if (linkMode !== "none") {
        formData.append('linkable_type', linkMode);
        formData.append('linkable_id', linkableId);
      }
      
      if (isEdit) {
          // Laravel needs _method=PUT when sending FormData
          formData.append('_method', 'PUT');
      }

      const url = isEdit ? `/v1/admin/offers/${id}` : "/v1/admin/offers";
      
      await apiClient(url, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });

      toast.success(isEdit ? "تم تحديث العرض بنجاح" : "تم إضافة العرض بنجاح");
      router.push("/offers");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "حدث خطأ أثناء حفظ العرض");
    } finally {
      setLoading(false);
    }
  };

  if (isEdit && error) return <div className="p-8 text-red-500 font-bold">حدث خطأ في تحميل بيانات العرض</div>;
  if (isEdit && !offerData) return <div className="p-8 text-slate-500 font-bold">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowRight size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {isEdit ? "تعديل العرض الترويجي" : "إضافة عرض جديد"}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">قم بتعبئة تفاصيل العرض لتنشره في المتجر</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">1</span>
            المعلومات الأساسية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 text-sm">العنوان (عربي) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                placeholder="أدخل عنوان العرض بالعربية"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 text-sm">العنوان (إنجليزي) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium text-left"
                placeholder="Enter offer title in English"
                dir="ltr"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 text-sm">الوصف (عربي)</label>
              <textarea
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                placeholder="تفاصيل العرض بالعربية"
              />
            </div>
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 text-sm">الوصف (إنجليزي)</label>
              <textarea
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium text-left"
                placeholder="Offer details in English"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Linking & Display */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">2</span>
            الربط والتوجيه (Nullable Links)
          </h2>
          <p className="text-sm text-slate-500">اختر أين يوجه هذا العرض عند النقر عليه (اختياري)</p>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {[
                { value: "none", label: "إعلان مرئي فقط (بدون رابط)" },
                { value: "product", label: "منتج محدد" },
                { value: "category", label: "قسم محدد" },
                { value: "printing_type", label: "نوع طباعة" },
                { value: "custom", label: "رابط خارجي مخصص" }
              ].map((mode) => (
                <label key={mode.value} className={`flex items-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-colors ${linkMode === mode.value ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                  <input
                    type="radio"
                    name="linkMode"
                    value={mode.value}
                    checked={linkMode === mode.value}
                    onChange={(e) => setLinkMode(e.target.value as any)}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold">{mode.label}</span>
                </label>
              ))}
            </div>

            {linkMode === "custom" && (
              <div className="pt-4 space-y-2">
                <label className="block font-bold text-slate-700 text-sm">الرابط المخصص</label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium text-left"
                  placeholder="https://example.com/..."
                  dir="ltr"
                />
              </div>
            )}

            {(linkMode === "product" || linkMode === "category" || linkMode === "printing_type") && (
              <div className="pt-4 space-y-2">
                <label className="block font-bold text-slate-700 text-sm">رقم العنصر (ID) <span className="text-slate-400 font-normal">(للتوجيه وإبطال الكاش التلقائي)</span></label>
                <input
                  type="number"
                  value={linkableId}
                  onChange={(e) => setLinkableId(e.target.value)}
                  className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                  placeholder={`أدخل معرف الـ ${linkMode}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">3</span>
            صورة العرض
          </h2>
          
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 text-sm">
              الصورة (سيتم تحويلها لـ WebP وتأمينها تلقائياً) {!isEdit && <span className="text-red-500">*</span>}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
              ref={fileInputRef}
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[21/9] bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-amber-400 transition-colors relative overflow-hidden group"
            >
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <UploadCloud size={32} className="mb-2" />
                    <span className="font-bold">تغيير الصورة</span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <ImageIcon size={48} className="mb-4 text-slate-300" />
                  <span className="font-bold">اضغط لاختيار صورة</span>
                  <span className="text-sm mt-1 text-slate-500">JPG, PNG, WebP (أقصى حجم 5MB)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Publishing & Timing */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">4</span>
            النشر والتوقيت
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isActive ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">حالة التفعيل</div>
                  <div className="text-xs text-slate-500">تفعيل أو تعطيل العرض مؤقتاً</div>
                </div>
              </label>

              <div className="space-y-2 pt-2">
                <label className="block font-bold text-slate-700 text-sm">ترتيب الظهور</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 text-sm">تاريخ البدء (اختياري)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium text-left"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 text-sm">تاريخ الانتهاء (اختياري)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium text-left"
                />
                <p className="text-xs text-slate-500">سيختفي العرض تلقائياً بعد هذا التاريخ بفضل الـ Time-based filtering.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-slate-300 flex items-center gap-3 disabled:opacity-70 text-lg"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save size={24} /> {isEdit ? "تحديث العرض" : "حفظ ونشر العرض"}
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function OfferFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">جاري التحميل...</div>}>
      <OfferFormContent />
    </Suspense>
  );
}
