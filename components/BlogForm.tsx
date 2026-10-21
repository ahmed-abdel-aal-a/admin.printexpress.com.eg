"use client";

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { apiClient } from "@/lib/api";
import { 
  UploadCloud, 
  Trash2, 
  Link as LinkIcon, 
  Sparkles, 
  Search, 
  Video as VideoIcon, 
  Image as ImageIcon, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

import type ReactQuillType from "react-quill-new";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false }) as React.ComponentType<React.ComponentProps<typeof ReactQuillType> & { ref?: React.Ref<ReactQuillType> }>;

interface BlogFormProps {
  initialData?: any;
}

export default function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const quillRef = useRef<ReactQuillType>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    category: initialData?.category || "",
    status: initialData?.status || "draft",
    meta_title: initialData?.meta_title || "",
    meta_description: initialData?.meta_description || "",
    meta_keywords: initialData?.meta_keywords || "",
    canonical_url: initialData?.canonical_url || "",
    is_indexable: initialData?.is_indexable ?? true,
    featured_image: initialData?.featured_image || "",
    video: initialData?.video || "",
    content: initialData?.content || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  // رفع الصورة البارزة (Featured Image)
  const handleFeaturedImageUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
      return;
    }

    const fd = new FormData();
    fd.append("image", file);

    setIsUploadingImage(true);
    const toastId = toast.loading("جاري رفع الصورة البارزة...");

    try {
      const data = await apiClient(`/v1/admin/upload-general`, {
        method: "POST",
        body: fd,
        isFormData: true,
      });

      setFormData((prev) => ({ ...prev, featured_image: data.url }));
      toast.success("تم رفع الصورة بنجاح!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء رفع الصورة", { id: toastId });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // رفع الصور داخل محرر المقال (Quill)
  const editorImageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      const fd = new FormData();
      fd.append("image", file);

      try {
        const toastId = toast.loading("جاري رفع الصورة داخل المقال...");
        const data = await apiClient(`/v1/admin/upload-general`, {
          method: "POST",
          body: fd,
          isFormData: true,
        });

        toast.dismiss(toastId);

        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection();
          editor.insertEmbed(range ? range.index : 0, "image", data.url);
        }
      } catch (error: any) {
        toast.error(error.message || "حدث خطأ أثناء الرفع");
      }
    };
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ direction: "rtl" }],
          [{ align: [] }],
          ["link", "image", "video"],
          ["clean"],
        ],
        handlers: {
          image: editorImageHandler,
        },
      },
    }),
    [editorImageHandler]
  );

  // توليد تلقائي لبيانات السيو
  const handleAutoGenerateSeo = () => {
    if (!formData.title) {
      toast.error("يرجى إدخال عنوان المقال أولاً لتوليد السيو");
      return;
    }

    let generatedDesc = formData.meta_description;
    if (!generatedDesc && formData.content) {
      // إزالة وسوم HTML وأخذ أول 150 حرف
      const cleanText = formData.content.replace(/<[^>]*>?/gm, "").trim();
      generatedDesc = cleanText.slice(0, 155);
    }

    setFormData((prev) => ({
      ...prev,
      meta_title: prev.meta_title || prev.title,
      meta_description: generatedDesc || prev.meta_description,
    }));

    toast.success("تم توليد عنوان ووصف السيو تلقائياً بنجاح");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = initialData ? `/v1/admin/blog-posts/${initialData.id}` : `/v1/admin/blog-posts`;
      const method = initialData ? "PUT" : "POST";

      await apiClient(url, {
        method,
        body: formData,
      });

      toast.success(initialData ? "تم تعديل المقال بنجاح" : "تم إضافة المقال بنجاح");
      if (!initialData) {
        router.push("/blog");
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // عدادات السيو وإشارات الجودة
  const titleLength = formData.meta_title.length;
  const descLength = formData.meta_description.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* القسم 1: المعلومات الأساسية */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <span>📝</span> البيانات الأساسية للمقال
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              عنوان المقال <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="اكتب عنواناً جذاباً للمقال..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              الرابط المخصص (Slug)
              <span className="text-xs font-normal text-slate-400 mr-2">(اتركه فارغاً لتوليده تلقائياً من العنوان)</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="مثال: afdal-khamat-tabaa"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">التصنيف</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="مثال: نصائح الطباعة، خامات الورق..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">حالة النشر</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            >
              <option value="draft">مسودة (غير ظاهر للجمهور)</option>
              <option value="published">منشور (ظاهر في المتجر)</option>
            </select>
          </div>
        </div>
      </div>

      {/* القسم 2: الوسائط (الصورة البارزة والفيديو) */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>🖼️</span> الوسائط البارزة (الصورة والفيديو)
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              تظهر أعلى المقال وفي بطاقة المقال في المتجر وصفحات التواصل الاجتماعي.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* الصورة البارزة */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon size={18} className="text-amber-600" />
                الصورة البارزة (Featured Image)
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                اختياري
              </span>
            </div>

            {/* إرشادات المقاس المناسب */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-800">
                <HelpCircle size={14} /> المقاس والتنسيق الموصى به:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 font-medium mr-1">
                <li>
                  الأبعاد المثالية: <strong className="text-amber-950 font-bold">1200 × 630 بكسل</strong> (نسبة 16:9).
                </li>
                <li>
                  أقصى حجم: <strong className="text-amber-950 font-bold">5 ميجابايت</strong> بصيغة (WebP, JPG, PNG).
                </li>
                <li className="text-slate-600">
                  يمكن تركها فارغة تماماً إذا كان المقال يعتمد على فيديو أو نص فقط.
                </li>
              </ul>
            </div>

            {/* معاينة الصورة الحالية إن وُجدت */}
            {formData.featured_image ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-slate-900 group shadow-sm">
                <div className="relative aspect-video w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.featured_image}
                    alt="معاينة الصورة البارزة"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, featured_image: "" }))}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                  >
                    <Trash2 size={14} /> حذف الصورة
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                  >
                    <UploadCloud size={14} /> تغيير الصورة
                  </button>
                </div>
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 truncate max-w-[260px] font-mono dir-ltr text-left">
                    {formData.featured_image}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, featured_image: "" }))}
                    className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 shrink-0 mr-2"
                  >
                    <Trash2 size={13} /> إزالة
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* تبديل طريقة الإدخال: رفع ملف أو رابط مباشر */}
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setImageInputMode("upload")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      imageInputMode === "upload"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    رفع صورة من الجهاز
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode("url")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      imageInputMode === "url"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    إدخال رابط مباشر
                  </button>
                </div>

                {imageInputMode === "upload" ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/70 hover:bg-amber-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] group"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">
                      {isUploadingImage ? "جاري رفع الصورة..." : "اضغط هنا لاختيار صورة من جهازك"}
                    </p>
                    <p className="text-xs text-slate-400">يدعم JPG, PNG, WEBP حتى 5MB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <LinkIcon size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
                      <input
                        type="url"
                        name="featured_image"
                        value={formData.featured_image}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all font-mono"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFeaturedImageUpload(file);
              }}
            />
          </div>

          {/* رابط الفيديو */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <VideoIcon size={18} className="text-red-600" />
                رابط الفيديو (YouTube)
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                اختياري
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="font-bold mb-1 flex items-center gap-1 text-slate-700">
                <HelpCircle size={14} /> فكرة تضمين الفيديو:
              </div>
              <p>
                إذا كان المقال يتمحور حول فيديو توضيحي أو شرح، ضع رابط الفيديو من يوتيوب هنا، وسيتم عرضه كمشغل فيديو تفاعلي بارز في أعلى المقال وصفحة المدونة.
              </p>
            </div>

            <div>
              <div className="relative">
                <VideoIcon size={18} className="absolute right-3.5 top-3.5 text-slate-400" />
                <input
                  type="url"
                  name="video"
                  value={formData.video}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              {formData.video && (
                <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> تم إدراج رابط الفيديو
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* القسم 3: تحسين محركات البحث والسيو (SEO Master) */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>🚀</span> تحسين محركات البحث (SEO & Google)
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              التحكم الكامل في ظهور مقالك في نتائج بحث جوجل وشبكات التواصل لمضاعفة الزيارات.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoGenerateSeo}
            className="self-start sm:self-auto bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Sparkles size={14} className="text-amber-600" />
            توليد السيو تلقائياً من المقال
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          {/* حقول السيو مع التوضيحات والعدادات */}
          <div className="space-y-6">
            {/* عنوان السيو */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-slate-800">
                  عنوان السيو (SEO Title)
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <span
                    className={`font-bold ${
                      titleLength >= 40 && titleLength <= 60
                        ? "text-emerald-600"
                        : titleLength > 60
                        ? "text-red-500"
                        : "text-slate-500"
                    }`}
                  >
                    {titleLength} / 60 حرف
                  </span>
                  {titleLength >= 40 && titleLength <= 60 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      مثالي ✓
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                العنوان الأزرق الذي ينقر عليه الباحث في جوجل. اجعله جذاباً ويحتوي على الكلمة المفتاحية. (الموصى به: 50 إلى 60 حرفاً).
              </p>
              <input
                type="text"
                name="meta_title"
                value={formData.meta_title}
                onChange={handleChange}
                maxLength={90}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="اتركه فارغاً ليتم استخدام عنوان المقال تلقائياً..."
              />
            </div>

            {/* وصف السيو */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-slate-800">
                  وصف السيو (SEO Description)
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <span
                    className={`font-bold ${
                      descLength >= 110 && descLength <= 160
                        ? "text-emerald-600"
                        : descLength > 160
                        ? "text-red-500"
                        : "text-slate-500"
                    }`}
                  >
                    {descLength} / 160 حرف
                  </span>
                  {descLength >= 110 && descLength <= 160 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      مثالي ✓
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                الفقرة التعريفية المختصرة التي تظهر أسفل العنوان لإقناع القارئ بالدخول. (الموصى به: 120 إلى 160 حرفاً).
              </p>
              <textarea
                name="meta_description"
                value={formData.meta_description}
                onChange={handleChange}
                maxLength={200}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                placeholder="اكتب نبذة ملهمة ومختصرة تشرح للقارئ ما سيتعلمه من هذا المقال..."
              />
            </div>

            {/* الكلمات المفتاحية ورابط الكانونيكال */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الكلمات المفتاحية (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  name="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-amber-500"
                  placeholder="طباعة, كروت شخصية, تصميم"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرابط الأصلي (Canonical URL - اختياري)
                </label>
                <input
                  type="url"
                  name="canonical_url"
                  value={formData.canonical_url}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-amber-500"
                  placeholder="https://printexpress.com/..."
                />
              </div>
            </div>
          </div>

          {/* المعاينة الحية لنتائج محرك بحث جوجل (Google Snippet Live Preview) */}
          <div className="flex flex-col">
            <label className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Search size={16} className="text-blue-600" />
              معاينة حية لشكل مقالك في بحث جوجل (Google Preview)
            </label>
            <div className="bg-[#f8f9fa] border border-slate-200/90 rounded-2xl p-5 flex-grow shadow-inner flex flex-col justify-center">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 max-w-full">
                {/* رابط الموقع والمسار */}
                <div className="flex items-center gap-2 mb-1.5 text-xs text-[#202124]">
                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-black font-black">
                    P
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="font-bold text-[13px] text-slate-800">برنت إكسبريس | Print Express</span>
                    <span className="text-[11px] text-[#5f6368] dir-ltr text-right truncate">
                      https://printexpress.com › blog › {formData.slug || "article-slug"}
                    </span>
                  </div>
                </div>

                {/* العنوان الأزرق القابل للنقر */}
                <h3 className="text-[#1a0dab] hover:underline font-medium text-lg leading-snug cursor-pointer mb-1.5 break-words">
                  {formData.meta_title || formData.title || "عنوان المقال الخاص بك يظهر هنا"} - برنت إكسبريس
                </h3>

                {/* الوصف في جوجل */}
                <p className="text-xs text-[#4d5156] leading-relaxed break-words line-clamp-3">
                  {formData.meta_description ||
                    "هنا سيظهر وصف المقال التعريفي الجذاب في نتائج بحث جوجل لمساعدة الزوار على معرفة المحتوى والنقر عليه..."}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>يتم توليد وسوم OpenGraph و Twitter Card و Schema Markup تلقائياً بالكامل.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* القسم 4: محتوى المقال */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <label className="block text-xl font-black text-slate-800 mb-2">
          <span>📖</span> محتوى المقال الكامل
        </label>
        <p className="text-xs text-slate-500 mb-4 font-medium">
          يمكنك تنسيق النصوص، إضافة عناوين، روابط، أو إدراج صور داخلية عبر شريط الأدوات أعلاه.
        </p>
        <div className="bg-white rounded-xl overflow-hidden border border-slate-200" dir="ltr">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={formData.content}
            onChange={handleContentChange}
            modules={modules}
            className="min-h-[380px] mb-12"
          />
        </div>
      </div>

      {/* زر الحفظ النهائي */}
      <div className="flex items-center justify-between pt-4 pb-12">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          إلغاء والعودة
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploadingImage}
          className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300 disabled:opacity-50 text-base flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>جاري الحفظ والمزامنة...</>
          ) : initialData ? (
            <>حفظ التعديلات</>
          ) : (
            <>نشر المقال الجديد</>
          )}
        </button>
      </div>
    </form>
  );
}
