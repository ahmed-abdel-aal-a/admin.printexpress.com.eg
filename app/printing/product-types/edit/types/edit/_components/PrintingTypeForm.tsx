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
  upload_categories: z.array(z.string()).optional(),
  bleed_margin: z.number().min(0).optional(),
  safe_zone: z.number().min(0).optional(),
  thickness_factor: z.number().min(0).optional(),
  base_production_days: z.number().min(1),
  is_market_sensitive: z.boolean().optional(),
  market_notice: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const STANDARD_UPLOAD_CATEGORIES = [
  { id: 'design', label: 'التصميم الأساسي (Design)' },
  { id: 'spot_uv_mask', label: 'قناع الورنيش الموضعي (Spot UV)' },
  { id: 'foil_mask', label: 'قناع الفويل / البصمة (Foil)' },
  { id: 'cutting_guide', label: 'دليل القص / الدايكت (Die-cut)' },
  { id: 'emboss_mask', label: 'قناع البروز (Embossing)' },
];

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
      upload_categories: type.upload_categories || ['design'],
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
        upload_categories: data.upload_categories || [],
        bleed_margin: data.bleed_margin || 0,
        safe_zone: data.safe_zone || 0,
        thickness_factor: data.thickness_factor || 0,
        base_production_days: data.base_production_days,
      },
    });

    toast.success('تم حفظ الإعدادات بنجاح');
  };

  const pricingMethod = form.watch('pricing_method');
  const currentCategories = form.watch('upload_categories') || [];

  const toggleCategory = (catId: string) => {
    const exists = currentCategories.includes(catId);
    let next: string[];
    if (exists) {
      next = currentCategories.filter((c) => c !== catId);
    } else {
      next = [...currentCategories, catId];
    }
    form.setValue('upload_categories', next, { shouldDirty: true });
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (trimmed && !currentCategories.includes(trimmed)) {
      form.setValue('upload_categories', [...currentCategories, trimmed], { shouldDirty: true });
      setCustomCategoryInput('');
    }
  };

  const handleRemoveCategory = (catId: string) => {
    form.setValue('upload_categories', currentCategories.filter((c) => c !== catId), { shouldDirty: true });
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
              <Label className="text-sm font-semibold text-blue-950">تصنيفات الملفات المطلوبة للرفع (Upload Categories)</Label>
              <p className="text-xs text-gray-500 mt-0.5">حدد الملفات المطلوب من العميل رفعها لطلب هذا المنتج (مثل ملف التصميم الأساسي، قناع الورنيش، إلخ).</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {STANDARD_UPLOAD_CATEGORIES.map((cat) => {
                const isSelected = currentCategories.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-100/80 border-blue-400 font-medium text-blue-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      checked={isSelected}
                      onChange={() => toggleCategory(cat.id)}
                    />
                    <span>{cat.label}</span>
                  </label>
                );
              })}
            </div>

            {currentCategories.filter(c => !STANDARD_UPLOAD_CATEGORIES.some(sc => sc.id === c)).length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-medium text-gray-600">تصنيفات مخصصة إضافية:</span>
                <div className="flex flex-wrap gap-2">
                  {currentCategories.filter(c => !STANDARD_UPLOAD_CATEGORIES.some(sc => sc.id === c)).map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-300">
                      <code>{cat}</code>
                      <button type="button" onClick={() => handleRemoveCategory(cat)} className="text-blue-600 hover:text-red-600 font-bold ml-1">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 max-w-sm pt-2">
              <Input
                placeholder="إضافة تصنيف مخصص (مثال: booklet_inner)"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCategory(); } }}
                className="text-xs bg-white"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddCustomCategory}>
                إضافة
              </Button>
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
