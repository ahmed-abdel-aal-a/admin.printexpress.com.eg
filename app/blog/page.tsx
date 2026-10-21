"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Video, Image as ImageIcon } from "lucide-react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { getAuthToken, API_BASE_URL, rawFetcher, apiClient } from "@/lib/api";

export default function BlogListPage() {
  const [page, setPage] = useState(1);
  const { data: response, error, mutate } = useSWR(`/v1/admin/blog-posts?page=${page}`, rawFetcher);
  const posts = response?.data;
  const lastPage = response?.last_page || 1;
  
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المقال؟")) return;
    
    setIsDeleting(id);
    try {
      await apiClient(`/v1/admin/blog-posts/${id}`, { method: "DELETE" });
      
      toast.success("تم الحذف بنجاح");
      mutate();
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(null);
    }
  };

  if (error) return <div className="p-8 text-red-500 font-bold">حدث خطأ في تحميل المقالات</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة المدونة</h1>
          <p className="text-slate-500 mt-2 font-medium">التحكم الكامل في المقالات والمحتوى المرئي</p>
        </div>
        <Link
          href="/blog/new"
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-200 flex items-center gap-2"
        >
          <Plus size={20} /> إضافة مقال جديد
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-sm uppercase tracking-wide">
                <th className="p-4 whitespace-nowrap">العنوان</th>
                <th className="p-4 whitespace-nowrap">التصنيف</th>
                <th className="p-4 whitespace-nowrap">الحالة</th>
                <th className="p-4 whitespace-nowrap">تاريخ النشر</th>
                <th className="p-4 whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!posts ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">جاري التحميل...</td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-bold text-lg">لا توجد مقالات حالياً</td>
                </tr>
              ) : (
                posts.map((post: any) => (
                  <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                           {post.featured_image ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img src={post.featured_image} alt="" className="w-full h-full object-cover" />
                           ) : post.video ? (
                             <Video className="text-slate-400" size={24} />
                           ) : (
                             <ImageIcon className="text-slate-400" size={24} />
                           )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base">{post.title}</p>
                          <p className="text-slate-500 text-sm">{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
                      {post.category || 'بدون تصنيف'}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {post.status === 'published' ? 'منشور' : 'مسودة'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium whitespace-nowrap text-sm">
                      {format(new Date(post.created_at), 'PPP', { locale: ar })}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/blog/edit?id=${post.id}`}
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-amber-100 hover:text-amber-700 transition-colors"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={isDeleting === post.id}
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
