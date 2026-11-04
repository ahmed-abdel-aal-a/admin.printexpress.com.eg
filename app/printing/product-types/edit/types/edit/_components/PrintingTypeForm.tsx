'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PrintingType } from '@/types/printing-options';
import { useUpdatePrintingType } from '@/hooks/printing/usePrintingTypes';
import { toCents, toEGP } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { uploadService } from '@/lib/services/upload';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

export interface UploadSlotConfig {
  id: string;
  label: string;
  help_text?: string | null;
  is_required: boolean;
  allowed_extensions: string[];
}

export const STANDARD_UPLOAD_PRESETS: UploadSlotConfig[] = [
  { 
    id: 'design', 
    label: 'ملف التصميم الأساسي', 
    help_text: 'يرجى رفع ملف بجودة 300 DPI بصيغة PDF أو AI مع زيادة القص 3 مم', 
    is_required: true, 
    allowed_extensions: ['pdf', 'ai', 'psd', 'zip', 'rar'] 
  },
  { 
    id: 'spot_uv_mask', 
    label: 'قناع الورنيش الموضعي (Spot UV)', 
    help_text: 'ملف متجهي بلون أسود 100% لتحديد أماكن الورنيش الموضعي', 
    is_required: false, 
    allowed_extensions: ['pdf', 'ai'] 
  },
  { 
    id: 'foil_mask', 
    label: 'قناع الفويل / البصمة (Foil)', 
    help_text: 'ملف متجهي بلون أسود 100% لتحديد أماكن البصمة الحرارية', 
    is_required: false, 
    allowed_extensions: ['pdf', 'ai'] 
  },
  { 
    id: 'cutting_guide', 
    label: 'دليل القص / الدايكت (Die-cut)', 
    help_text: 'خطوط القص وريج الخط باللون الأحمر أو خط Spot مخصص', 
    is_required: false, 
    allowed_extensions: ['pdf', 'ai'] 
  },
  { 
    id: 'emboss_mask', 
    label: 'قناع البروز (Embossing)', 
    help_text: 'ملف متجهي لتحديد أماكن الكشف والبروز', 
    is_required: false, 
    allowed_extensions: ['pdf', 'ai'] 
  },
];

export const STANDARD_UPLOAD_CATEGORIES = STANDARD_UPLOAD_PRESETS.map(p => ({ id: p.id, label: p.label }));

const normalizeSlots = (raw: any): UploadSlotConfig[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [STANDARD_UPLOAD_PRESETS[0]];
  }
  return raw.map((item: any) => {
    if (typeof item === 'string') {
      const preset = STANDARD_UPLOAD_PRESETS.find(p => p.id === item);
      return preset ? { ...preset } : {
        id: item,
        label: item,
        help_text: '',
        is_required: false,
        allowed_extensions: ['pdf', 'ai', 'psd', 'zip', 'rar']
      };
    }
    const preset = STANDARD_UPLOAD_PRESETS.find(p => p.id === item.id);
    return {
      id: item.id || 'design',
      label: item.label || preset?.label || item.id || 'ملف التصميم',
      help_text: item.help_text !== undefined ? item.help_text : (preset?.help_text || ''),
      is_required: Boolean(item.is_required !== undefined ? item.is_required : (preset?.is_required ?? false)),
      allowed_extensions: Array.isArray(item.allowed_extensions) && item.allowed_extensions.length > 0
        ? item.allowed_extensions.map((e: string) => e.replace(/^\./, '').toLowerCase().trim()).filter(Boolean)
        : (preset?.allowed_extensions || ['pdf', 'ai', 'psd', 'zip', 'rar'])
    };
  });
};

const formSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  description: z.string().nullable(),
  image: z.string().nullable().optional(),
  pricing_method: z.enum(['fixed', 'attributes_only', 'area']),
  base_price_fixed_egp: z.number().min(0),
  base_price_unit_egp: z.number().min(0),
  base_price_multiplier_egp: z.number().min(0),
  min_quantity: z.number().min(1),
  quantity_step: z.number().min(1),
  min_chargeable_area: z.number().min(0),
  min_chargeable_price_egp: z.number().min(0),
  is_active: z.boolean(),
  requires_upload: z.boolean(),
  upload_rules: z.object({
    max_files_limit: z.number().nullable().optional(),
    allow_additional_attachments: z.boolean().optional(),
    pricing_by_image_count: z.boolean().optional(),
  }).nullable().optional(),
  upload_categories: z.array(z.any()).optional(),
  bleed_margin: z.number().min(0).optional(),
  safe_zone: z.number().min(0).optional(),
  thickness_factor: z.number().min(0).optional(),
  base_production_days: z.number().min(1),
  is_market_sensitive: z.boolean().optional(),
  market_notice: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PrintingTypeForm({ type }: { type: PrintingType }) {
  const updateMutation = useUpdatePrintingType();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: type.name,
      description: type.description || '',
      image: type.image || '',
      pricing_method: type.pricing_method,
      base_price_fixed_egp: toEGP(type.base_price_fixed),
      base_price_unit_egp: toEGP(type.base_price_unit),
      base_price_multiplier_egp: toEGP(type.base_price_multiplier),
      min_quantity: type.min_quantity,
      quantity_step: type.quantity_step,
      min_chargeable_area: type.min_chargeable_area,
      min_chargeable_price_egp: toEGP(type.min_chargeable_price),
      is_active: type.is_active,
      requires_upload: type.requires_upload,
      is_market_sensitive: Boolean((type as any).is_market_sensitive),
      market_notice: (type as any).market_notice || '',
      upload_rules: type.upload_rules || {
        max_files_limit: null,
        allow_additional_attachments: false,
        pricing_by_image_count: false,
      },
      upload_categories: normalizeSlots(type.upload_categories),
      bleed_margin: type.bleed_margin || 0,
      safe_zone: type.safe_zone || 0,
      thickness_factor: Number(type.thickness_factor) || 0,
      base_production_days: type.base_production_days,
    },
  });

  const onSubmit = async (data: FormValues) => {
    let imageUrl = data.image;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const res = await uploadService.uploadImage(selectedFile);
        imageUrl = res.url;
      } catch (e) {
        alert("فشل رفع الصورة");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const cleanedUploadCategories = (data.upload_categories || []).map((slot: any) => ({
      id: String(slot.id || '').trim().toLowerCase(),
      label: String(slot.label || '').trim(),
      help_text: slot.help_text && String(slot.help_text).trim() ? String(slot.help_text).trim() : null,
      is_required: Boolean(slot.is_required),
      allowed_extensions: (Array.isArray(slot.allowed_extensions) ? slot.allowed_extensions : ['pdf', 'ai', 'psd', 'zip', 'rar'])
        .map((ext: string) => String(ext).replace(/^\./, '').toLowerCase().trim())
        .filter(Boolean),
    })).filter((s: any) => s.id && s.label);

    if (data.requires_upload) {
      const hasRequiredSlot = cleanedUploadCategories.some((s: any) => s.is_required);
      if (!hasRequiredSlot) {
        toast.error("طالما يتطلب هذا المنتج رفع ملفات، يجب تحديد خانة رفع واحدة على الأقل كخانة إلزامية.");
        return;
      }
    }

    await updateMutation.mutateAsync({
      id: type.id,
      data: {
        name: data.name,
        description: data.description,
        image: imageUrl,
        pricing_method: data.pricing_method,
        base_price_fixed: toCents(data.base_price_fixed_egp),
        base_price_unit: toCents(data.base_price_unit_egp),
        base_price_multiplier: toCents(data.base_price_multiplier_egp),
        min_quantity: data.min_quantity,
        quantity_step: data.quantity_step,
        min_chargeable_area: data.min_chargeable_area,
        min_chargeable_price: toCents(data.min_chargeable_price_egp),
        is_active: data.is_active,
        requires_upload: data.requires_upload,
        is_market_sensitive: data.is_market_sensitive ?? false,
        market_notice: data.market_notice || null,
        upload_rules: data.upload_rules,
        upload_categories: cleanedUploadCategories,
        bleed_margin: data.bleed_margin || 0,
        safe_zone: data.safe_zone || 0,
        thickness_factor: data.thickness_factor || 0,
        base_production_days: data.base_production_days,
      },
    });

    toast.success('تم حفظ الإعدادات بنجاح');
  };

  const pricingMethod = form.watch('pricing_method');
  const currentSlots: UploadSlotConfig[] = form.watch('upload_categories') || [];

  const updateSlot = (index: number, patch: Partial<UploadSlotConfig>) => {
    const next = [...currentSlots];
    next[index] = { ...next[index], ...patch };
    form.setValue('upload_categories', next, { shouldDirty: true });
  };

  const removeSlot = (index: number) => {
    if (currentSlots.length <= 1) {
      toast.error('يجب الإبقاء على خانة رفع واحدة على الأقل طالما أن رفع الملفات مطلوب.');
      return;
    }
    const next = currentSlots.filter((_, i) => i !== index);
    form.setValue('upload_categories', next, { shouldDirty: true });
  };

  const toggleSlotExtension = (slotIndex: number, ext: string) => {
    const cleanExt = ext.replace(/^\./, '').toLowerCase().trim();
    const slot = currentSlots[slotIndex];
    const currentExts = slot.allowed_extensions || [];
    const exists = currentExts.includes(cleanExt);
    let nextExts: string[];
    if (exists) {
      if (currentExts.length <= 1) {
        toast.error('يجب تحديد امتداد واحد على الأقل مسموح به.');
        return;
      }
      nextExts = currentExts.filter((e) => e !== cleanExt);
    } else {
      nextExts = [...currentExts, cleanExt];
    }
    updateSlot(slotIndex, { allowed_extensions: nextExts });
  };

  const addPresetSlot = (preset: UploadSlotConfig) => {
    if (currentSlots.some((s) => s.id === preset.id)) {
      toast.error('هذه الخانة مضافة بالفعل.');
      return;
    }
    const next = [...currentSlots, { ...preset }];
    form.setValue('upload_categories', next, { shouldDirty: true });
  };

  const handleAddCustomSlot = () => {
    const labelTrimmed = customCategoryInput.trim();
    if (!labelTrimmed) return;
    const cleanId = `custom_${Date.now()}`;
    const newSlot: UploadSlotConfig = {
      id: cleanId,
      label: labelTrimmed,
      help_text: '',
      is_required: false,
      allowed_extensions: ['pdf', 'ai', 'psd', 'zip', 'rar'],
    };
    form.setValue('upload_categories', [...currentSlots, newSlot], { shouldDirty: true });
    setCustomCategoryInput('');
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>اسم نوع الطباعة</Label>
          <Input {...form.register('name')} />
          {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>طريقة التسعير الأساسية</Label>
          <Select 
            value={pricingMethod} 
            onValueChange={(val: any) => form.setValue('pricing_method', val, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">سعر ثابت + خصائص</SelectItem>
              <SelectItem value="area">حسب المساحة (عرض × طول)</SelectItem>
              <SelectItem value="attributes_only">تسعير بالخصائص فقط</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>الوصف (اختياري)</Label>
          <Textarea {...form.register('description')} rows={3} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>صورة النوع (اختياري)</Label>
          <div className="flex flex-col gap-4">
            {(form.watch('image') || selectedFile) && (
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {selectedFile ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="preview" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                  <img src={form.watch('image')!} alt="preview" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">صورة مرفوعة</p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      setSelectedFile(null);
                      form.setValue('image', null, { shouldDirty: true });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف الصورة
                  </Button>
                </div>
              </div>
            )}
            <Input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                  form.setValue('image', 'temp', { shouldDirty: true }); // trigger dirty state
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Pricing Settings based on method */}
      <div className="bg-gray-50 p-6 rounded-lg border space-y-6">
        <h3 className="font-semibold text-gray-900 border-b pb-2">إعدادات التسعير</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(pricingMethod === 'fixed' || pricingMethod === 'area') && (
            <div className="space-y-2">
              <Label>السعر الأساسي الثابت (ج.م)</Label>
              <Input type="number" step="0.01" {...form.register('base_price_fixed_egp', { valueAsNumber: true })} />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>سعر الوحدة الإضافي (ج.م)</Label>
            <Input type="number" step="0.01" {...form.register('base_price_unit_egp', { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label>معامل السعر (ج.م)</Label>
            <Input type="number" step="0.01" {...form.register('base_price_multiplier_egp', { valueAsNumber: true })} />
          </div>
          
          {pricingMethod === 'area' && (
            <>
              <div className="space-y-2">
                <Label>الحد الأدنى للمساحة المحتسبة (سم²)</Label>
                <Input type="number" {...form.register('min_chargeable_area', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>الحد الأدنى للسعر الإجمالي (ج.م)</Label>
                <Input type="number" step="0.01" {...form.register('min_chargeable_price_egp', { valueAsNumber: true })} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>أقل كمية للطلب</Label>
          <Input type="number" {...form.register('min_quantity', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label>مضاعفات الكمية (Step)</Label>
          <Input type="number" {...form.register('quantity_step', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label>مدة الإنتاج الأساسية (أيام)</Label>
          <Input type="number" {...form.register('base_production_days', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
        <div className="space-y-2">
          <Label>هامش القص الخارجي (Bleed Margin - مم)</Label>
          <Input type="number" step="1" {...form.register('bleed_margin', { valueAsNumber: true })} />
          <p className="text-xs text-gray-500">منطقة الزيادة لمنع الحواف البيضاء عند القص (مثال: 2 أو 3 مم).</p>
        </div>
        <div className="space-y-2">
          <Label>منطقة الأمان الداخلية (Safe Zone - مم)</Label>
          <Input type="number" step="1" {...form.register('safe_zone', { valueAsNumber: true })} />
          <p className="text-xs text-gray-500">المسافة التي يجب أن تبتعد عنها النصوص من حافة القص (مثال: 3 مم).</p>
        </div>
        <div className="space-y-2">
          <Label>معامل سماكة الورقة (Thickness Factor - مم)</Label>
          <Input type="number" step="0.01" {...form.register('thickness_factor', { valueAsNumber: true })} />
          <p className="text-xs text-gray-500">سماكة الورقة الواحدة لحساب كعب الكتيبات والكتب (مثال: 0.12 مم).</p>
        </div>
      </div>

      <div className="flex gap-8 border-t pt-6">
        <div className="flex items-center gap-3">
          <input 
            type="checkbox"
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            checked={form.watch('is_active') || false}
            onChange={(e) => form.setValue('is_active', e.target.checked, { shouldDirty: true })}
          />
          <Label>مفعل ونشط</Label>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="checkbox"
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            checked={form.watch('requires_upload') || false}
            onChange={(e) => form.setValue('requires_upload', e.target.checked, { shouldDirty: true })}
          />
          <Label>يتطلب رفع ملف للطباعة</Label>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="checkbox"
            className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
            checked={form.watch('is_market_sensitive') || false}
            onChange={(e) => form.setValue('is_market_sensitive', e.target.checked, { shouldDirty: true })}
          />
          <div className="flex flex-col">
            <Label className="cursor-pointer font-bold text-amber-900">خاضع لتسعيرة اليوم (مراجعة السعر قبل الدفع)</Label>
            <span className="text-[11px] text-amber-700">عند تفعيله، يتم تعليق الطلب حتى يعتمد الأدمن السعر النهائي ويرسل رابط الدفع للعميل.</span>
          </div>
        </div>
      </div>

      {form.watch('is_market_sensitive') && (
        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-2">
          <Label className="text-amber-900 text-xs font-bold">تنبيه مخصص للعميل في المتجر والسلة (اختياري)</Label>
          <Input 
            placeholder="مثال: هذا المنتج خاضع لتسعيرة الخامات اليومية، سيتم مراجعة طلبك واعتماد السعر النهائي قبل الدفع"
            {...form.register('market_notice')}
          />
        </div>
      )}

      {form.watch('requires_upload') && (
        <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100 space-y-6">
          <h3 className="font-semibold text-blue-900 border-b border-blue-100 pb-2">إعدادات الرفع (Upload Rules)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>الحد الأقصى للملفات (اختياري)</Label>
              <Input 
                type="number" 
                placeholder="مثال: 10" 
                {...form.register('upload_rules.max_files_limit', { 
                  setValueAs: v => v === "" ? null : parseInt(v, 10) 
                })} 
              />
              <p className="text-xs text-gray-500">اتركه فارغاً لعدم تحديد حد أقصى.</p>
            </div>
            
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  checked={form.watch('upload_rules.allow_additional_attachments') || false}
                  onChange={(e) => form.setValue('upload_rules.allow_additional_attachments', e.target.checked, { shouldDirty: true })}
                />
                <Label>السماح برفع مرفقات إضافية</Label>
              </div>
              
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  checked={form.watch('upload_rules.pricing_by_image_count') || false}
                  onChange={(e) => form.setValue('upload_rules.pricing_by_image_count', e.target.checked, { shouldDirty: true })}
                />
                <Label>التسعير بعدد الصور المرفوعة (مثل ألبومات الصور)</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-blue-200">
            <div>
              <Label className="text-sm font-semibold text-blue-950">إدارة خانات رفع الملفات (Upload Slots Builder)</Label>
              <p className="text-xs text-gray-500 mt-0.5">خصص العناوين والتعليمات والامتدادات المسموحة لكل خانة تظهر للعميل في المتجر.</p>
            </div>

            {/* List of current slots */}
            <div className="space-y-3">
              {currentSlots.map((slot, idx) => (
                <div key={slot.id} className="p-4 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
                        #{slot.id}
                      </span>
                      <span className="text-xs text-gray-400">خانة {idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          checked={slot.is_required}
                          onChange={(e) => updateSlot(idx, { is_required: e.target.checked })}
                        />
                        <span>إجباري للطلب (*)</span>
                      </label>
                      {currentSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlot(idx)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="حذف هذه الخانة"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-700">عنوان البوكس في المتجر (*)</Label>
                      <Input
                        value={slot.label}
                        onChange={(e) => updateSlot(idx, { label: e.target.value })}
                        placeholder="مثال: ملف التصميم الأساسي"
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-700">التعليمات والنص الإرشادي (Help Text)</Label>
                      <Input
                        value={slot.help_text || ''}
                        onChange={(e) => updateSlot(idx, { help_text: e.target.value })}
                        placeholder="مثال: يرجى ترك زيادة قص 3 مم وألوان CMYK"
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <Label className="text-[11px] font-semibold text-gray-600">الصيغ والامتدادات المسموحة:</Label>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {['pdf', 'ai', 'psd', 'zip', 'rar', 'jpg', 'png'].map((ext) => {
                        const isAllowed = (slot.allowed_extensions || []).includes(ext);
                        return (
                          <button
                            key={ext}
                            type="button"
                            onClick={() => toggleSlotExtension(idx, ext)}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase transition-colors border ${
                              isAllowed 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            .{ext}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Presets & Add custom */}
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 space-y-2">
              <span className="text-xs font-semibold text-blue-900 block">إضافة خانة جديدة سريعة من القوالب:</span>
              <div className="flex flex-wrap gap-2">
                {STANDARD_UPLOAD_PRESETS.map((preset) => {
                  const alreadyAdded = currentSlots.some((s) => s.id === preset.id);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => addPresetSlot(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        alreadyAdded 
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60' 
                          : 'bg-white text-blue-800 border-blue-300 hover:bg-blue-100'
                      }`}
                    >
                      + {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2 border-t border-blue-200/60 max-w-md">
                <Input
                  placeholder="أو اكتب عنوان خانة مخصصة (مثال: غلاف المذكرة)"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSlot(); } }}
                  className="h-8 text-xs bg-white"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddCustomSlot} className="h-8 text-xs shrink-0">
                  إضافة خانة مخصصة
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending || isUploading || !form.formState.isDirty}>
          {updateMutation.isPending || isUploading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </form>
  );
}
