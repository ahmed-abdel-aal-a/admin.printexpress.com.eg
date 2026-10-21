'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PrintingType, PrintingAttribute } from '@/types/printing-options';
import { 
  useCreatePrintingAttribute, 
  useDeletePrintingAttribute,
  useCreatePrintingAttributeValue,
  useDeletePrintingAttributeValue 
} from '@/hooks/printing/usePrintingTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { toCents, toEGP } from '@/lib/currency';

const attributeSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['select', 'radio', 'checkbox', 'number', 'multiplier_number']),
  step: z.enum(['specifications', 'finishing']),
  is_required: z.boolean(),
  is_dimension_width: z.boolean(),
  is_dimension_length: z.boolean(),
});

const valueSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  fixed_price_egp: z.number().min(0),
  unit_price_egp: z.number().min(0),
  multiplier_price_egp: z.number().min(0),
  weight: z.number().min(0),
  weight_type: z.enum(['per_unit', 'per_sqm']),
  added_production_days: z.number().min(0),
  required_upload_category: z.string().nullable().optional(),
});

export default function AttributesBuilder({ type }: { type: PrintingType }) {
  const createAttrMutation = useCreatePrintingAttribute();
  const deleteAttrMutation = useDeletePrintingAttribute();

  const [isAddingAttr, setIsAddingAttr] = useState(false);
  const [expandedAttr, setExpandedAttr] = useState<number | null>(null);

  const attrForm = useForm<z.infer<typeof attributeSchema>>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      type: 'select',
      step: 'specifications',
      is_required: true,
      is_dimension_width: false,
      is_dimension_length: false,
    },
  });

  const onAddAttr = async (data: z.infer<typeof attributeSchema>) => {
    await createAttrMutation.mutateAsync({
      printing_type_id: type.id,
      ...data,
      sort_order: 0,
      min_value: null,
      max_value: null,
      conditional_rules: null,
      linked_upload_category: null,
    });
    attrForm.reset();
    setIsAddingAttr(false);
  };

  const handleDeleteAttr = async (id: number) => {
    if (confirm('حذف هذه الخاصية سيؤدي لحذف جميع الخيارات المرتبطة بها. هل أنت متأكد؟')) {
      await deleteAttrMutation.mutateAsync({ id, typeId: type.id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">منشئ الخصائص (Attributes Builder)</h3>
          <p className="text-sm text-gray-500">أضف الخصائص (مثل نوع الورق، المقاس) والقيم الخاصة بها.</p>
        </div>
        {!isAddingAttr && (
          <Button onClick={() => setIsAddingAttr(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> إضافة خاصية
          </Button>
        )}
      </div>

      {isAddingAttr && (
        <form onSubmit={attrForm.handleSubmit(onAddAttr)} className="bg-gray-50 p-4 rounded-lg border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>الاسم البرمجي (name)</Label>
            <Input {...attrForm.register('name')} placeholder="paper_type" />
          </div>
          <div className="space-y-2">
            <Label>العنوان للعميل (label)</Label>
            <Input {...attrForm.register('label')} placeholder="نوع الورق" />
          </div>
          <div className="space-y-2">
            <Label>نوع الحقل</Label>
            <Select onValueChange={(val: any) => attrForm.setValue('type', val)} defaultValue="select">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="select">قائمة منسدلة (Select)</SelectItem>
                <SelectItem value="radio">خيارات (Radio)</SelectItem>
                <SelectItem value="checkbox">مربع اختيار (Checkbox)</SelectItem>
                <SelectItem value="number">رقم (Number)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>مرحلة الطلب</Label>
            <Select onValueChange={(val: any) => attrForm.setValue('step', val)} defaultValue="specifications">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="specifications">مواصفات الطباعة</SelectItem>
                <SelectItem value="finishing">التشطيب والإضافات</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              checked={attrForm.watch('is_required') || false} 
              onChange={(e) => attrForm.setValue('is_required', e.target.checked)} 
            />
            <Label>إجباري</Label>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              checked={attrForm.watch('is_dimension_width') || false} 
              onChange={(e) => attrForm.setValue('is_dimension_width', e.target.checked)} 
            />
            <Label>يمثل "العرض"</Label>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              checked={attrForm.watch('is_dimension_length') || false} 
              onChange={(e) => attrForm.setValue('is_dimension_length', e.target.checked)} 
            />
            <Label>يمثل "الطول"</Label>
          </div>

          <div className="lg:col-span-4 flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddingAttr(false)}>إلغاء</Button>
            <Button type="submit" disabled={createAttrMutation.isPending}>إضافة الخاصية</Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {type.attributes?.map(attr => (
          <div key={attr.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="flex justify-between items-center p-4 bg-gray-50/50 cursor-pointer" onClick={() => setExpandedAttr(expandedAttr === attr.id ? null : attr.id)}>
              <div className="flex flex-col">
                <span className="font-bold">{attr.label} <span className="text-sm font-normal text-gray-500">({attr.name})</span></span>
                <span className="text-xs text-gray-500 mt-1">{attr.type} • {attr.step}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteAttr(attr.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                {expandedAttr === attr.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>

            {expandedAttr === attr.id && (
              <div className="p-4 border-t">
                <ValuesManager attribute={attr} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Nested Component for Values
function ValuesManager({ attribute }: { attribute: PrintingAttribute }) {
  const createValMutation = useCreatePrintingAttributeValue();
  const deleteValMutation = useDeletePrintingAttributeValue();
  
  const form = useForm<z.infer<typeof valueSchema>>({
    resolver: zodResolver(valueSchema),
    defaultValues: {
      fixed_price_egp: 0,
      unit_price_egp: 0,
      multiplier_price_egp: 0,
      weight: 0,
      weight_type: 'per_unit',
      added_production_days: 0,
      required_upload_category: '',
    }
  });

  const onSubmit = async (data: z.infer<typeof valueSchema>) => {
    await createValMutation.mutateAsync({
      printing_attribute_id: attribute.id,
      value: data.value,
      label: data.label,
      fixed_price: toCents(data.fixed_price_egp),
      unit_price: toCents(data.unit_price_egp),
      multiplier_price: toCents(data.multiplier_price_egp),
      weight: data.weight,
      weight_type: data.weight_type,
      tiered_prices: null,
      added_production_days: data.added_production_days,
      required_upload_category: data.required_upload_category ? data.required_upload_category.trim() : null,
      sort_order: 0,
    });
    form.reset();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end bg-gray-50/70 p-3 rounded-lg border">
        <div>
          <Label className="text-xs mb-1 block">القيمة البرمجية</Label>
          <Input size={1} {...form.register('value')} placeholder="spot_uv" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">الاسم للعميل</Label>
          <Input size={1} {...form.register('label')} placeholder="ورنيش موضعي" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">سعر ثابت (ج.م)</Label>
          <Input size={1} type="number" step="0.01" {...form.register('fixed_price_egp', { valueAsNumber: true })} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">سعر الوحدة (ج.م)</Label>
          <Input size={1} type="number" step="0.01" {...form.register('unit_price_egp', { valueAsNumber: true })} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">تصنيف الرفع المطلوب</Label>
          <Input size={1} {...form.register('required_upload_category')} placeholder="spot_uv_mask" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="w-full" disabled={createValMutation.isPending}>إضافة خيار</Button>
        </div>
      </form>

      <div className="mt-4">
        {(!attribute.values || attribute.values.length === 0) ? (
          <div className="text-center text-sm text-gray-500 py-4">لا توجد خيارات مضافة لهذه الخاصية</div>
        ) : (
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-2">الاسم</th>
                <th className="p-2">القيمة</th>
                <th className="p-2">السعر الثابت</th>
                <th className="p-2">سعر الوحدة</th>
                <th className="p-2">تصنيف الرفع المطلوب</th>
                <th className="p-2">حذف</th>
              </tr>
            </thead>
            <tbody>
              {attribute.values.map(val => (
                <tr key={val.id} className="border-b">
                  <td className="p-2 font-medium">{val.label}</td>
                  <td className="p-2 text-gray-500 font-mono text-xs">{val.value}</td>
                  <td className="p-2">{toEGP(val.fixed_price)} ج.م</td>
                  <td className="p-2">{toEGP(val.unit_price)} ج.م</td>
                  <td className="p-2">
                    {val.required_upload_category ? (
                      <span className="inline-block px-2 py-0.5 text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        {val.required_upload_category}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => deleteValMutation.mutate(val.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
