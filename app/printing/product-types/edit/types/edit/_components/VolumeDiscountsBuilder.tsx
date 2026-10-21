'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PrintingType, PrintingVolumeDiscount } from '@/types/printing-options';
import { useCreatePrintingVolumeDiscount, useDeletePrintingVolumeDiscount } from '@/hooks/printing/usePrintingTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Trash2, Plus } from 'lucide-react';

const formSchema = z.object({
  min_qty: z.coerce.number({ message: 'الحد الأدنى مطلوب' }).min(1, 'يجب أن يكون الحد الأدنى 1 على الأقل'),
  max_qty: z.coerce.number().nullable(),
  discount_percentage: z.coerce.number().min(0, 'نسبة الخصم لا تقل عن 0').max(100, 'نسبة الخصم لا تزيد عن 100'),
  added_production_days: z.coerce.number().min(0),
}).refine(
  (data) => {
    if (data.max_qty !== null && data.max_qty !== undefined && !isNaN(data.max_qty)) {
      return data.max_qty > data.min_qty;
    }
    return true;
  },
  {
    message: 'الحد الأقصى للكمية يجب أن يكون أكبر من الحد الأدنى',
    path: ['max_qty'],
  }
);

type FormValues = z.infer<typeof formSchema>;

export default function VolumeDiscountsBuilder({ type }: { type: PrintingType }) {
  const createMutation = useCreatePrintingVolumeDiscount();
  const deleteMutation = useDeletePrintingVolumeDiscount();

  const [isAdding, setIsAdding] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      min_qty: 100,
      max_qty: null,
      discount_percentage: 0,
      added_production_days: 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Convert percentage to basis points (e.g. 5% -> 500)
    const discount_basis_points = Math.round(data.discount_percentage * 100);
    
    await createMutation.mutateAsync({
      printing_type_id: type.id,
      min_qty: data.min_qty,
      max_qty: data.max_qty,
      discount_basis_points,
      added_production_days: data.added_production_days,
    });
    
    form.reset();
    setIsAdding(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      await deleteMutation.mutateAsync({ id, typeId: type.id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">خصومات الكميات (Volume Discounts)</h3>
          <p className="text-sm text-gray-500">قم بإضافة شرائح الخصم بناءً على الكمية المطلوبة.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> إضافة شريحة خصم
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-gray-50 p-4 rounded-lg border grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label>الحد الأدنى للكمية</Label>
            <Input type="number" {...form.register('min_qty', { valueAsNumber: true })} />
            {form.formState.errors.min_qty && (
              <p className="text-red-500 text-xs font-medium">{form.formState.errors.min_qty.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>الحد الأقصى (اختياري)</Label>
            <Input type="number" {...form.register('max_qty', { valueAsNumber: true })} />
            {form.formState.errors.max_qty && (
              <p className="text-red-500 text-xs font-medium">{form.formState.errors.max_qty.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>نسبة الخصم (%)</Label>
            <Input type="number" step="0.01" {...form.register('discount_percentage', { valueAsNumber: true })} />
            {form.formState.errors.discount_percentage && (
              <p className="text-red-500 text-xs font-medium">{form.formState.errors.discount_percentage.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>أيام إنتاج إضافية</Label>
            <Input type="number" {...form.register('added_production_days', { valueAsNumber: true })} />
            {form.formState.errors.added_production_days && (
              <p className="text-red-500 text-xs font-medium">{form.formState.errors.added_production_days.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending} className="w-full">حفظ</Button>
            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>إلغاء</Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 font-medium text-gray-500">من (كمية)</th>
                <th className="p-3 font-medium text-gray-500">إلى (كمية)</th>
                <th className="p-3 font-medium text-gray-500">الخصم (%)</th>
                <th className="p-3 font-medium text-gray-500">أيام إضافية</th>
                <th className="p-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(!type.volumeDiscounts || type.volumeDiscounts.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    لا توجد خصومات كمية مسجلة
                  </td>
                </tr>
              )}
              {type.volumeDiscounts?.map(discount => (
                <tr key={discount.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3">{discount.min_qty}</td>
                  <td className="p-3">{discount.max_qty || 'فأكثر'}</td>
                  <td className="p-3 font-medium text-green-600">%{(discount.discount_basis_points / 100).toFixed(2)}</td>
                  <td className="p-3">{discount.added_production_days} أيام</td>
                  <td className="p-3 text-left">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(discount.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
