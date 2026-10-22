"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddonGroupFormValues, addonGroupSchema } from "../schema";
import { AddonGroup } from "../types";
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

interface AddonGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddonGroupFormValues) => void;
  isSubmitting: boolean;
  initialData?: AddonGroup | null;
}

export default function AddonGroupFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
}: AddonGroupFormModalProps) {
  const form = useForm<AddonGroupFormValues>({
    resolver: zodResolver(addonGroupSchema) as any,
    defaultValues: {
      name: { ar: "", en: "" },
      description: { ar: "", en: "" },
      input_type: "checkbox",
      is_required: false,
      price_multiplier_type: "per_item",
      is_active: true,
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          description: initialData.description || { ar: "", en: "" },
          input_type: initialData.input_type,
          is_required: initialData.is_required,
          price_multiplier_type: initialData.price_multiplier_type,
          is_active: initialData.is_active,
          sort_order: initialData.sort_order,
        });
      } else {
        form.reset({
          name: { ar: "", en: "" },
          description: { ar: "", en: "" },
          input_type: "checkbox",
          is_required: false,
          price_multiplier_type: "per_item",
          is_active: true,
          sort_order: 0,
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = (data: AddonGroupFormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-8 pt-7 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-900">{initialData ? "تعديل مجموعة الخدمات" : "إضافة مجموعة خدمات جديدة"}</DialogTitle>
        </DialogHeader>

        <form id="addon-group-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 py-5 px-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">الاسم (عربي) *</Label>
              <Input {...form.register("name.ar")} placeholder="مثال: التغليف" className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all" />
              {form.formState.errors.name?.ar && (
                <p className="text-red-500 text-xs">{form.formState.errors.name.ar.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">الاسم (إنجليزي) *</Label>
              <Input {...form.register("name.en")} placeholder="e.g. Packaging" dir="ltr" className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all" />
              {form.formState.errors.name?.en && (
                <p className="text-red-500 text-xs">{form.formState.errors.name.en.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">الوصف (عربي) اختياري</Label>
              <Input {...form.register("description.ar")} placeholder="وصف توضيحي للعميل..." className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">الوصف (إنجليزي) اختياري</Label>
              <Input {...form.register("description.en")} placeholder="Description for customer..." dir="ltr" className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">نوع الإدخال *</Label>
              <Select
                value={form.watch("input_type")}
                onValueChange={(v) => form.setValue("input_type", v as any)}
              >
                <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all">
                  <SelectValue placeholder="اختر نوع الإدخال" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-slate-100">
                  <SelectItem value="checkbox">متعدد (Checkbox)</SelectItem>
                  <SelectItem value="radio">اختيار واحد (Radio)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">طريقة التسعير *</Label>
              <Select
                value={form.watch("price_multiplier_type")}
                onValueChange={(v) => form.setValue("price_multiplier_type", v as any)}
              >
                <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all">
                  <SelectValue placeholder="اختر طريقة التسعير" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-slate-100">
                  <SelectItem value="per_item">لكل قطعة (مضروب في الكمية)</SelectItem>
                  <SelectItem value="per_order_line">لكل طلب (سعر ثابت مرة واحدة)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-slate-800 cursor-pointer">إجباري؟</Label>
                <p className="text-xs text-slate-500">هل يجب على العميل الاختيار؟</p>
              </div>
              <Switch
                checked={form.watch("is_required")}
                onCheckedChange={(v) => form.setValue("is_required", v)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-slate-800 cursor-pointer">مفعل؟</Label>
                <p className="text-xs text-slate-500">ظاهرة للعملاء بالمتجر؟</p>
              </div>
              <Switch
                checked={form.watch("is_active")}
                onCheckedChange={(v) => form.setValue("is_active", v)}
              />
            </div>
          </div>
          
          <div className="space-y-2 max-w-xs">
            <Label className="text-sm font-semibold text-slate-700">ترتيب العرض (Sort Order)</Label>
            <Input type="number" {...form.register("sort_order", { valueAsNumber: true })} className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all" />
          </div>
        </form>

        <DialogFooter className="gap-3 px-8 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl px-5 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium">
            إلغاء
          </Button>
          <Button type="submit" form="addon-group-form" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-xl shadow-sm transition-all" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
