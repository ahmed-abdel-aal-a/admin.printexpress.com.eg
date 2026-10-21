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
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "تعديل مجموعة الخدمات" : "إضافة مجموعة خدمات جديدة"}</DialogTitle>
        </DialogHeader>

        <form id="addon-group-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الاسم (عربي) *</Label>
              <Input {...form.register("name.ar")} placeholder="مثال: التغليف" />
              {form.formState.errors.name?.ar && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.ar.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>الاسم (إنجليزي) *</Label>
              <Input {...form.register("name.en")} placeholder="e.g. Packaging" dir="ltr" />
              {form.formState.errors.name?.en && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.en.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الوصف (عربي) اختياري</Label>
              <Input {...form.register("description.ar")} placeholder="وصف توضيحي للعميل..." />
            </div>
            <div className="space-y-2">
              <Label>الوصف (إنجليزي) اختياري</Label>
              <Input {...form.register("description.en")} placeholder="Description for customer..." dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الإدخال *</Label>
              <Select
                value={form.watch("input_type")}
                onValueChange={(v) => form.setValue("input_type", v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الإدخال" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkbox">متعدد (Checkbox)</SelectItem>
                  <SelectItem value="radio">اختيار واحد (Radio)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>طريقة التسعير *</Label>
              <Select
                value={form.watch("price_multiplier_type")}
                onValueChange={(v) => form.setValue("price_multiplier_type", v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة التسعير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_item">لكل قطعة (مضروب في الكمية)</SelectItem>
                  <SelectItem value="per_order_line">لكل طلب (سعر ثابت مرة واحدة)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
            <div>
              <Label className="text-base font-bold text-slate-800">إجباري؟</Label>
              <p className="text-sm text-slate-500">هل يجب على العميل اختيار خدمة من هذه المجموعة؟</p>
            </div>
            <Switch
              checked={form.watch("is_required")}
              onCheckedChange={(v) => form.setValue("is_required", v)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
            <div>
              <Label className="text-base font-bold text-slate-800">مفعل؟</Label>
              <p className="text-sm text-slate-500">هل هذه المجموعة ظاهرة للعملاء؟</p>
            </div>
            <Switch
              checked={form.watch("is_active")}
              onCheckedChange={(v) => form.setValue("is_active", v)}
            />
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
          <Button type="submit" form="addon-group-form" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
