"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductAddonFormValues, productAddonSchema } from "../schema";
import { ProductAddon } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";

interface ProductAddonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductAddonFormValues) => void;
  isSubmitting: boolean;
  initialData?: ProductAddon | null;
}

export default function ProductAddonFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
}: ProductAddonFormModalProps) {
  const form = useForm<ProductAddonFormValues>({
    resolver: zodResolver(productAddonSchema) as any,
    defaultValues: {
      name: { ar: "", en: "" },
      description: { ar: "", en: "" },
      type: "simple",
      price: 0,
      price_type: "fixed",
      printing_type_id: null,
      requires_upload: false,
      allow_multiple_uploads: false,
      max_uploads: 1,
      track_inventory: false,
      quantity: 0,
      is_active: true,
      sort_order: 0,
    },
  });

  const { data: printingTypes = [] } = useQuery({
    queryKey: ["printingTypes"],
    queryFn: () => fetcher("/v1/admin/printing-types"),
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          description: initialData.description || { ar: "", en: "" },
          type: initialData.type,
          price: initialData.price,
          price_type: initialData.price_type,
          printing_type_id: initialData.printing_type_id ? initialData.printing_type_id.toString() : null,
          requires_upload: initialData.requires_upload,
          allow_multiple_uploads: initialData.allow_multiple_uploads,
          max_uploads: initialData.max_uploads,
          track_inventory: initialData.track_inventory,
          quantity: initialData.quantity,
          is_active: initialData.is_active,
          sort_order: initialData.sort_order,
        });
      } else {
        form.reset({
          name: { ar: "", en: "" },
          description: { ar: "", en: "" },
          type: "simple",
          price: 0,
          price_type: "fixed",
          printing_type_id: null,
          requires_upload: false,
          allow_multiple_uploads: false,
          max_uploads: 1,
          track_inventory: false,
          quantity: 0,
          is_active: true,
          sort_order: 0,
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: ProductAddonFormValues) => {
    onSubmit(data);
  };

  const typeWatch = form.watch("type");
  const trackInventoryWatch = form.watch("track_inventory");
  const priceTypeWatch = form.watch("price_type");

  useEffect(() => {
    if (typeWatch === "simple") {
      form.setValue("printing_type_id", null);
    }
  }, [typeWatch, form]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</DialogTitle>
        </DialogHeader>

        <form id="product-addon-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم (عربي) *</Label>
              <Input {...form.register("name.ar")} placeholder="مثال: تغليف فاخر" />
              {form.formState.errors.name?.ar && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.ar.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>الاسم (إنجليزي) *</Label>
              <Input {...form.register("name.en")} placeholder="e.g. Premium Packaging" dir="ltr" />
              {form.formState.errors.name?.en && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.en.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الوصف (عربي) اختياري</Label>
              <Input {...form.register("description.ar")} placeholder="وصف للعميل..." />
            </div>
            <div className="space-y-2">
              <Label>الوصف (إنجليزي) اختياري</Label>
              <Input {...form.register("description.en")} placeholder="Description..." dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="space-y-2">
              <Label>طريقة التسعير *</Label>
              <Select
                value={priceTypeWatch}
                onValueChange={(v) => form.setValue("price_type", v as "fixed" | "percentage")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة التسعير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">مبلغ ثابت (ج.م)</SelectItem>
                  <SelectItem value="percentage">نسبة مئوية من سعر المنتج (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>السعر / النسبة *</Label>
              <Input 
                type="number" 
                step="0.01"
                {...form.register("price", { valueAsNumber: true })} 
                placeholder={priceTypeWatch === 'percentage' ? 'مثال: 10' : 'مثال: 150'}
              />
              {form.formState.errors.price && (
                <p className="text-red-500 text-sm">{form.formState.errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الخدمة *</Label>
              <Select
                value={typeWatch}
                onValueChange={(v) => form.setValue("type", v as "simple" | "printing_linked")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">خدمة عادية (تغليف، كارت إهداء...)</SelectItem>
                  <SelectItem value="printing_linked">خدمة مرتبطة بالطباعة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {typeWatch === "printing_linked" && (
              <div className="space-y-2">
                <Label>نوع الطباعة المرتبط *</Label>
                <Select
                  value={form.watch("printing_type_id") || ""}
                  onValueChange={(v) => form.setValue("printing_type_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الطباعة" />
                  </SelectTrigger>
                  <SelectContent>
                    {printingTypes.map((pt: any) => (
                      <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.printing_type_id && (
                  <p className="text-red-500 text-sm">{form.formState.errors.printing_type_id.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
              <div>
                <Label className="text-base font-bold text-slate-800">تتبع المخزون</Label>
                <p className="text-sm text-slate-500">هل لهذه الخدمة كمية محدودة؟</p>
              </div>
              <Switch
                checked={trackInventoryWatch}
                onCheckedChange={(v) => form.setValue("track_inventory", v)}
              />
            </div>
            
            {trackInventoryWatch && (
              <div className="space-y-2 flex flex-col justify-center">
                <Label>الكمية المتاحة بالمخزن *</Label>
                <Input 
                  type="number" 
                  {...form.register("quantity", { valueAsNumber: true })} 
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
              <div>
                <Label className="text-base font-bold text-slate-800">رفع ملفات؟</Label>
                <p className="text-sm text-slate-500">هل تتطلب هذه الخدمة من العميل رفع ملف/تصميم؟</p>
              </div>
              <Switch
                checked={form.watch("requires_upload")}
                onCheckedChange={(v) => form.setValue("requires_upload", v)}
              />
            </div>
            {form.watch("requires_upload") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 border rounded-xl bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-bold">ملفات متعددة؟</Label>
                    <p className="text-xs text-slate-500">تمكين العميل من رفع عدة صور</p>
                  </div>
                  <Switch
                    checked={form.watch("allow_multiple_uploads")}
                    onCheckedChange={(v) => form.setValue("allow_multiple_uploads", v)}
                  />
                </div>
                {form.watch("allow_multiple_uploads") && (
                  <div className="space-y-2 flex flex-col justify-center">
                    <Label className="text-sm">الحد الأقصى للملفات</Label>
                    <Input type="number" min="2" {...form.register("max_uploads", { valueAsNumber: true })} />
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
              <div>
                <Label className="text-base font-bold text-slate-800">مفعلة؟</Label>
                <p className="text-sm text-slate-500">هل هذه الخدمة ظاهرة للعملاء؟</p>
              </div>
              <Switch
                checked={form.watch("is_active")}
                onCheckedChange={(v) => form.setValue("is_active", v)}
              />
            </div>
          </div>
          
          <div className="space-y-2 max-w-xs">
            <Label>ترتيب العرض (Sort Order)</Label>
            <Input type="number" {...form.register("sort_order", { valueAsNumber: true })} />
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" form="product-addon-form" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            حفظ الخدمة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
