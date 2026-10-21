'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePrintingType } from '@/hooks/printing/usePrintingTypes';
import { Button } from '@/components/ui/button';
import { ArrowRight, Settings, Layers, Percent } from 'lucide-react';
import PrintingTypeForm from './_components/PrintingTypeForm';
import AttributesBuilder from './_components/AttributesBuilder';
import VolumeDiscountsBuilder from './_components/VolumeDiscountsBuilder';

function PrintingTypeBuilderContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const typeId = searchParams.get('typeId');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'attributes' | 'discounts'>('settings');

  const { data: printingType, isLoading } = usePrintingType(Number(typeId));

  if (isLoading) return <div className="p-8">جاري التحميل...</div>;
  if (!printingType) return <div className="p-8">نوع الطباعة غير موجود</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/printing/product-types/edit/types?id=${id}`)}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{printingType.name}</h1>
          <p className="text-gray-500 text-sm mt-1">منشئ الخيارات والتسعير الديناميكي</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="h-4 w-4" />
          الإعدادات العامة
        </button>
        <button
          onClick={() => setActiveTab('attributes')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'attributes' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          منشئ الخصائص
        </button>
        <button
          onClick={() => setActiveTab('discounts')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'discounts' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Percent className="h-4 w-4" />
          خصومات الكميات
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[500px]">
        {activeTab === 'settings' && <PrintingTypeForm type={printingType} />}
        {activeTab === 'attributes' && <AttributesBuilder type={printingType} />}
        {activeTab === 'discounts' && <VolumeDiscountsBuilder type={printingType} />}
      </div>
    </div>
  );
}

export default function PrintingTypeBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8">جاري التحميل...</div>}>
      <PrintingTypeBuilderContent />
    </Suspense>
  );
}
