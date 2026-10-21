import React from 'react';

interface SEOFieldsProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function SEOFields({ formData, setFormData }: SEOFieldsProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm w-full mt-4">
      <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">سيو والذكاء الاصطناعي (SEO & GEO)</h3>
      
      {/* معاينة جوجل (Google Search Preview) */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-sm text-gray-500 mb-1">{formData.canonical_url || `https://printexpress.com/product/${formData.slug || 'product-slug'}`}</p>
        <h4 className="text-xl text-blue-700 cursor-pointer hover:underline">
          {formData.seo_title || formData.name || 'عنوان الصفحة'}
        </h4>
        <p className="text-sm text-gray-600 mt-1">
          {formData.seo_description || 'هنا يظهر الوصف المختصر الذي يقرأه عملاؤك على محرك بحث جوجل أو روبوتات الذكاء الاصطناعي.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-semibold text-gray-700">عنوان السيو (SEO Title)</label>
          <input 
            type="text" 
            maxLength={70}
            className="border rounded p-2 focus:ring-2 focus:ring-blue-500 w-full"
            value={formData.seo_title || ''}
            onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
            placeholder="مثال: كروت شخصية فاخرة | Print Express"
          />
          <span className="text-xs text-gray-400 mt-1">{formData.seo_title?.length || 0} / 70 حرف</span>
        </div>

        {/* Canonical URL */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-semibold text-gray-700">الرابط الأساسي (Canonical URL)</label>
          <input 
            type="url" 
            className="border rounded p-2 focus:ring-2 focus:ring-blue-500 w-full text-left" dir="ltr"
            value={formData.canonical_url || ''}
            onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
            placeholder="https://printexpress.com/..."
          />
        </div>
        
        {/* Description */}
        <div className="flex flex-col md:col-span-2">
          <label className="mb-1 text-sm font-semibold text-gray-700">وصف البحث والـ AI (Meta Description)</label>
          <p className="text-xs text-gray-500 mb-1">اكتب هنا وصفاً لغوياً طبيعياً يسهل على الذكاء الاصطناعي فهمه (مثل: نقدم أفضل جودة لطباعة هذا المنتج...)</p>
          <textarea 
            rows={3}
            maxLength={160}
            className="border rounded p-2 focus:ring-2 focus:ring-blue-500 w-full"
            value={formData.seo_description || ''}
            onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
          />
          <span className="text-xs text-gray-400 mt-1">{formData.seo_description?.length || 0} / 160 حرف</span>
        </div>

        {/* Indexable Toggle */}
        <div className="flex items-center mt-4 md:col-span-2">
          <input 
            type="checkbox" 
            id="is_indexable"
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            checked={formData.is_indexable ?? true}
            onChange={(e) => setFormData({ ...formData, is_indexable: e.target.checked })}
          />
          <label htmlFor="is_indexable" className="ml-2 mr-2 font-semibold text-gray-700">
            السماح لـ Google وروبوتات الـ AI بفهرسة هذه الصفحة (Index & Follow)
          </label>
        </div>
      </div>
    </div>
  );
}
