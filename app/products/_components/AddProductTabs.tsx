"use client";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { ProductFormValues } from "../schema";
import { Category, Attribute } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Trash2, ImageIcon, Coins, Tag, ChevronDown, PackageOpen, Sparkles } from "lucide-react";
import { useState } from "react";

// --- BasicInfoTab ---
export function BasicInfoTab({ form, categories }: { form: UseFormReturn<ProductFormValues>; categories: Category[] }) {
  const { register, formState: { errors } } = form;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>اسم المنتج <span className="text-red-500">*</span></Label>
        <Input placeholder="أدخل اسم المنتج" {...register("name")} className={errors.name ? "border-red-500" : ""} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>وصف المنتج</Label>
        <Textarea placeholder="اكتب وصفاً تفصيلياً للمنتج..." className="h-32" {...register("description")} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>التصنيف <span className="text-red-500">*</span></FormLabel>
              <Select key={field.value || 'empty'} dir="rtl" onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs text-red-500 mt-1" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>نوع المنتج</FormLabel>
              <Select dir="rtl" onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المنتج" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="simple">بسيط</SelectItem>
                  <SelectItem value="variable">متغير (له مقاسات/ألوان)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs text-red-500 mt-1" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// --- PricingTab ---
export function PricingTab({ form }: { form: UseFormReturn<ProductFormValues> }) {
  const { register, formState: { errors } } = form;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>السعر الأساسي <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input type="number" placeholder="0.00" {...register("price")} className={`pl-12 ${errors.price ? "border-red-500" : ""}`} />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">ج.م</span>
          </div>
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>السعر بعد التخفيض</Label>
          <div className="relative">
            <Input type="number" placeholder="0.00" {...register("discountPrice")} className="pl-12" />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">ج.م</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- InventoryTab ---
export function InventoryTab({ form }: { form: UseFormReturn<ProductFormValues> }) {
  const { register } = form;
  const trackInventory = form.watch("trackInventory");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>SKU (رمز التخزين)</Label>
          <Input placeholder="مثال: PRD-001" {...register("sku")} />
        </div>
        <div className="space-y-2">
          <Label>الباركود (Barcode)</Label>
          <Input placeholder="أدخل رقم الباركود" {...register("barcode")} />
        </div>
      </div>
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-800">تتبع المخزون</h4>
          <p className="text-sm text-slate-500">قم بتفعيل هذا الخيار لتتبع كميات هذا المنتج</p>
        </div>
        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={trackInventory} onChange={(e) => form.setValue("trackInventory", e.target.checked, { shouldValidate: true })} />
      </div>
      {trackInventory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-2">
            <Label>الكمية المتاحة</Label>
            <Input type="number" placeholder="0" {...register("quantity")} />
          </div>
          <div className="space-y-2">
            <Label>الوزن (كجم)</Label>
            <Input type="number" placeholder="0.0" {...register("weight")} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- ImagesTab ---
import { useEffect } from "react";
import toast from "react-hot-toast";

export function ImagesTab({ 
  files, 
  setFiles, 
  existingImages = [], 
  setExistingImages 
}: { 
  files: File[], 
  setFiles: React.Dispatch<React.SetStateAction<File[]>>,
  existingImages?: string[],
  setExistingImages?: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    // Generate object URLs only for files that don't have one yet (or regenerate all cleanly)
    const objectUrls = files.map((file) => URL.createObjectURL(file));
    setPreviews(objectUrls);
    
    return () => {
      // Clean up object URLs to prevent memory leak
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`حجم الصورة ${file.name} يتجاوز 5 ميجابايت.`);
          return false;
        }
        return true;
      });
      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    if (setExistingImages) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <ImageIcon className="w-8 h-8 text-indigo-500" />
        </div>
        <h4 className="text-lg font-bold text-slate-800 mb-1">أضف صور المنتج</h4>
        <p className="text-slate-500 text-sm max-w-sm mb-6">اسحب وأفلت الصور هنا، أو اضغط لاختيار ملفات من جهازك. يُفضل استخدام صور بخلفية بيضاء وبدقة عالية.</p>
        <Button type="button" variant="outline" className="bg-white pointer-events-none">استعراض الملفات</Button>
      </div>
      {(files.length > 0 || existingImages.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {existingImages.map((url, idx) => (
            <div key={`existing-${idx}`} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
              <img src={url} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
              <img src={previews[idx]} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeFile(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- SEOTab ---
export function SEOTab({ form }: { form: UseFormReturn<ProductFormValues> }) {
  const { register } = form;
  const isIndexable = form.watch("isIndexable");
  const name = form.watch("name");
  const seoTitle = form.watch("seoTitle");
  const seoDescription = form.watch("seoDescription");
  const canonicalUrl = form.watch("canonicalUrl");
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium flex items-start gap-3 border border-blue-100">
        <Sparkles className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" />
        <p>تحسين محركات البحث والذكاء الاصطناعي (SEO & GEO) يساعد في ظهور منتجك واقتراحه للعملاء عبر ChatGPT و Google.</p>
      </div>
      
      {/* معاينة جوجل (Google Search Preview) */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-sm text-gray-500 mb-1" dir="ltr">{canonicalUrl || `https://printexpress.com/product/...`}</p>
        <h4 className="text-xl text-blue-700 cursor-pointer hover:underline truncate">
          {seoTitle || name || 'عنوان صفحة المنتج'}
        </h4>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {seoDescription || 'هنا يظهر الوصف المختصر الذي يقرأه عملاؤك على محرك بحث جوجل أو روبوتات الذكاء الاصطناعي.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>عنوان صفحة المنتج (SEO Title)</Label>
          <Input placeholder="عنوان يظهر في محركات البحث" {...register("seoTitle")} maxLength={70} />
          <span className="text-xs text-gray-400 mt-1 block">{seoTitle?.length || 0} / 70 حرف</span>
        </div>
        
        <div className="space-y-2">
          <Label>الرابط الأساسي (Canonical URL)</Label>
          <Input placeholder="https://printexpress.com/..." {...register("canonicalUrl")} dir="ltr" className="text-left" />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label>وصف البحث والـ AI (Meta Description)</Label>
          <p className="text-xs text-gray-500 mb-2">اكتب وصفاً لغوياً طبيعياً يسهل على الذكاء الاصطناعي فهمه.</p>
          <Textarea placeholder="وصف موجز للمنتج يظهر أسفل العنوان في محركات البحث..." className="h-24" {...register("seoDescription")} maxLength={160} />
          <span className="text-xs text-gray-400 mt-1 block">{seoDescription?.length || 0} / 160 حرف</span>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <input 
              type="checkbox" 
              id="isIndexable"
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
              checked={isIndexable ?? true} 
              onChange={(e) => form.setValue("isIndexable", e.target.checked, { shouldValidate: true })} 
            />
            <label htmlFor="isIndexable" className="mr-3 font-semibold text-slate-700 cursor-pointer select-none">
              السماح لـ Google وروبوتات الذكاء الاصطناعي بفهرسة هذه الصفحة (Index & Follow)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
