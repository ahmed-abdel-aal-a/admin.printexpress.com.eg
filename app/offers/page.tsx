"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { rawFetcher, apiClient } from "@/lib/api";
import { getBackendMediaUrl } from "@/lib/utils";

export default function OffersListPage() {
  const [page, setPage] = useState(1);
  const { data: response, error, mutate } = useSWR(`/v1/admin/offers?page=${page}`, rawFetcher);
  const offers = response?.data;
  const lastPage = response?.last_page || 1;
  
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا العرض؟ سيتم إزالته فوراً من المتجر!")) return;
    
    setIsDeleting(id);
    try {
      await apiClient(`/v1/admin/offers/${id}`, { method: "DELETE" });
      
      toast.success("تم الحذف بنجاح");
      mutate();
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(null);
    }
  };

  if (error) return <div className="p-8 text-red-500 font-bold">حدث خطأ في تحميل العروض</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة العروض الترويجية</h1>
          <p className="text-slate-500 mt-2 font-medium">التحكم في العروض المعروضة على الصفحة الرئيسية</p>
        </div>
        <Link
          href="/offers/form"
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-200 flex items-center gap-2"
        >
          <Plus size={20} /> إضافة عرض جديد
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-sm uppercase tracking-wide">
                <th className="p-4 whitespace-nowrap">العنوان</th>
                <th className="p-4 whitespace-nowrap">التوجيه (Linkable)</th>
                <th className="p-4 whitespace-nowrap">الحالة</th>
                <th className="p-4 whitespace-nowrap">تاريخ الانتهاء</th>
                <th className="p-4 whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!offers ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">جاري التحميل...</td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-bold text-lg">لا توجد عروض حالياً</td>
                </tr>
              ) : (
                offers.map((offer: any) => (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                           {offer.image_path ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img 
                               src={getBackendMediaUrl(typeof offer.image_path === 'string' ? offer.image_path : offer.image_path.desktop)} 
                               alt={offer.title?.ar || ''} 
                               className="w-full h-full object-cover" 
                             />
                           ) : (
                             <ImageIcon className="text-slate-400" size={24} />
                           )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base">{offer.title?.ar || 'بدون عنوان'}</p>
                          <p className="text-slate-500 text-xs">ترتيب: {offer.sort_order}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium whitespace-nowrap text-sm">
                      {offer.custom_url ? (
                        <span className="text-blue-500 break-all">{offer.custom_url}</span>
                      ) : offer.linkable_type ? (
                        <span>{offer.linkable_type} #{offer.linkable_id}</span>
                      ) : (
                        <span className="text-slate-400 italic">بدون توجيه (إعلاني فقط)</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        offer.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {offer.is_active ? 'مفعل' : 'معطل'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium whitespace-nowrap text-sm">
                      {offer.end_date ? format(new Date(offer.end_date), 'PPP', { locale: ar }) : 'مفتوح'}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/offers/form?id=${offer.id}`}
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-amber-100 hover:text-amber-700 transition-colors"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(offer.id)}
                          disabled={isDeleting === offer.id}
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Controls */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            السابق
          </button>
          <span className="text-slate-600 font-medium px-4">صفحة {page} من {lastPage}</span>
          <button 
            onClick={() => setPage(p => Math.min(lastPage, p + 1))}
            disabled={page === lastPage}
            className="px-4 py-2 rounded-lg font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
