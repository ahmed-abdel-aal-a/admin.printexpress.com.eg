'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { printingProductTypeSchema, PrintingProductTypeFormValues } from './schema';
import { PrintingProductType } from '@/types/printing';
import { IconSelect } from './IconSelect';

interface PrintingProductTypeFormProps {
  initialData?: PrintingProductType;
  onSubmit: (data: PrintingProductTypeFormValues) => void;
  isLoading?: boolean;
}

export const PrintingProductTypeForm: React.FC<PrintingProductTypeFormProps> = ({ 
  initialData, 
  onSubmit, 
  isLoading 
}) => {
  const form = useForm<PrintingProductTypeFormValues>({
    resolver: zodResolver(printingProductTypeSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      icon: initialData?.icon || '',
      is_active: initialData !== undefined ? initialData.is_active : true,
      allow_custom_name: initialData !== undefined ? initialData.allow_custom_name : false,
      sort_order: initialData?.sort_order || 0,
    }
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
      <div>
        <label className="block text-sm font-medium mb-1">اسم القسم *</label>
        <input 
          {...register('name')} 
          className="w-full p-2 border rounded-md"
          placeholder="مثال: كتب ومطبوعات ورقية"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">الوصف</label>
        <textarea 
          {...register('description')} 
          className="w-full p-2 border rounded-md"
          rows={3}
          placeholder="وصف اختياري للقسم..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">الأيقونة</label>
        <IconSelect 
          value={watch('icon')} 
          onChange={(val) => setValue('icon', val)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">الترتيب</label>
          <input 
            type="number"
            {...register('sort_order')} 
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>

      <div className="flex gap-6 mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            {...register('is_active')}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">مفعل</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            {...register('allow_custom_name')}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">السماح باسم مخصص للمنتج</span>
        </label>
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'جاري الحفظ...' : 'حفظ البيانات'}
        </button>
      </div>
    </form>
  );
};
