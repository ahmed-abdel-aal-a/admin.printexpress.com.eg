'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePrintingTypes, useDeletePrintingType, useCreatePrintingType } from '@/hooks/printing/usePrintingTypes';
import { usePrintingProductTypes } from '@/hooks/printing/usePrintingProductTypes';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

import { Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

function PrintingTypesContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const productTypeId = Number(id);
  const router = useRouter();

  const { data: printingTypes, isLoading } = usePrintingTypes(productTypeId);
  const { data: productTypes } = usePrintingProductTypes();
  const currentProductType = productTypes?.find(pt => pt.id === productTypeId);

  const deleteMutation = useDeletePrintingType();
  const createMutation = useCreatePrintingType();

  const [isCreating, setIsCreating] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const handleDelete = async (typeId: number) => {
    if (confirm('هل أنت متأكد من حذف نوع الطباعة هذا؟')) {
      await deleteMutation.mutateAsync(typeId);
    }
  };

  const handleCreate = async () => {
    if (!newTypeName.trim()) return;
    try {
      const newType = await createMutation.mutateAsync({
        printing_product_type_id: productTypeId,
        name: newTypeName,
        description: null,
        pricing_method: 'fixed',
        base_price_fixed: 0,
        base_price_unit: 0,
        base_price_multiplier: 0,
        min_quantity: 1,
        quantity_step: 1,
        min_chargeable_area: 0,
        min_chargeable_price: 0,
        is_active: true,
        requires_upload: true,
        upload_rules: null,
        upload_categories: [],
        standard_roll_sizes: [],
        max_print_width: null,
        max_print_length: null,
        bleed_margin: 0,
        safe_zone: 0,
        thickness_factor: 0,
        base_production_days: 1,
        sort_order: 0,
      });
      setNewTypeName('');
      setIsCreating(false);
      // Navigate to builder
      router.push(`/printing/product-types/edit/types/edit?id=${productTypeId}&typeId=${newType.id}`);
    } catch (e) {
      // Error handled by hook
    }
  };

  if (isLoading) return <div className="p-8">جاري التحميل...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/printing/product-types">
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 text-gray-500 hover:text-gray-900">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              أنواع الطباعة {currentProductType ? `- ${currentProductType.name}` : ''}
            </h1>
            <p className="text-gray-500 text-sm mt-1">إدارة الأنواع المندرجة تحت هذا القسم</p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة نوع جديد
        </Button>
      </div>

      {isCreating && (
        <div className="bg-gray-50 p-4 rounded-lg border flex gap-4 items-center">
          <Input 
            value={newTypeName} 
            onChange={e => setNewTypeName(e.target.value)} 
            placeholder="اسم نوع الطباعة (مثال: كروت شخصية مسلفة)" 
            className="max-w-md"
          />
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ ومتابعة للإعدادات'}
          </Button>
          <Button variant="ghost" onClick={() => setIsCreating(false)}>إلغاء</Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50/50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-500">الاسم</th>
                <th className="p-4 font-medium text-gray-500">طريقة التسعير</th>
                <th className="p-4 font-medium text-gray-500">الحالة</th>
                <th className="p-4 font-medium text-gray-500 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {printingTypes?.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    لا توجد أنواع طباعة مضافة بعد
                  </td>
                </tr>
              )}
              {printingTypes?.map(type => (
                <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{type.name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {type.pricing_method === 'fixed' ? 'ثابت' : type.pricing_method === 'area' ? 'المساحة' : 'بالخصائص'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {type.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="p-4 text-left">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        onClick={() => router.push(`/printing/product-types/edit/types/edit?id=${productTypeId}&typeId=${type.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                        منشئ الخيارات
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

export default function PrintingTypesPage() {
  return (
    <Suspense fallback={<div className="p-8">جاري التحميل...</div>}>
      <PrintingTypesContent />
    </Suspense>
  );
}
