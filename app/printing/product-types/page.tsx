'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrintingProductTypes, useDeletePrintingProductType } from '@/hooks/printing/usePrintingProductTypes';
import { PrintingProductTypeModal } from './_components/PrintingProductTypeModal';
import { PrintingProductType } from '@/types/printing';
import * as Icons from 'lucide-react';

export default function PrintingProductTypesPage() {
  const router = useRouter();
  const { data: types, isLoading, error } = usePrintingProductTypes();
  const deleteMutation = useDeletePrintingProductType();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PrintingProductType | undefined>();

  const handleCreate = () => {
    setSelectedType(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (type: PrintingProductType) => {
    setSelectedType(type);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center" dir="rtl">جاري التحميل...</div>;
  if (error) return <div className="p-8 text-center text-red-500" dir="rtl">حدث خطأ أثناء جلب البيانات.</div>;

  return (
    <div className="p-8" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">أقسام المطبوعات</h1>
          <p className="text-gray-500 mt-1">إدارة الأقسام الرئيسية للطباعة (مثل: كتب، كروت شخصية...)</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">الترتيب</th>
              <th className="p-4 font-medium text-gray-500">الأيقونة</th>
              <th className="p-4 font-medium text-gray-500">الاسم</th>
              <th className="p-4 font-medium text-gray-500">الحالة</th>
              <th className="p-4 font-medium text-gray-500">الاسم المخصص</th>
              <th className="p-4 font-medium text-gray-500">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {types?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">لا توجد أقسام مطبوعات مضافة حتى الآن.</td>
              </tr>
            ) : (
              types?.map((type) => {
                const IconComponent = type.icon ? (Icons as any)[type.icon] : null;
                
                return (
                  <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">{type.sort_order}</td>
                    <td className="p-4">
                      {IconComponent ? <IconComponent className="w-5 h-5 text-gray-500" /> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="p-4 font-medium">{type.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {type.is_active ? 'مفعل' : 'معطل'}
                      </span>
                    </td>
                    <td className="p-4">
                      {type.allow_custom_name ? (
                        <Icons.Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Icons.X className="w-4 h-4 text-red-600" />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => router.push(`/printing/product-types/edit/types?id=${type.id}`)}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md flex items-center gap-1 font-medium transition-colors"
                          title="إدارة أنواع الطباعة (الأسعار والمتطلبات)"
                        >
                          <Icons.Settings className="w-4 h-4" />
                          إدارة الأنواع
                        </button>
                        <button 
                          onClick={() => handleEdit(type)}
                          className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="تعديل اسم القسم"
                        >
                          <Icons.Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(type.id)}
                          className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="حذف"
                          disabled={deleteMutation.isPending}
                        >
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PrintingProductTypeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedType}
      />
    </div>
  );
}
