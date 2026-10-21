"use client";

import React, { useEffect, useState, Suspense } from "react";
import BlogForm from "@/components/BlogForm";
import Link from "next/link";
import { getAuthToken, API_BASE_URL, fetcher } from "@/lib/api";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

function BlogEditContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        const data = await fetcher(`/v1/admin/blog-posts/${id}`);
        setInitialData(data);
      } catch (error) {
        toast.error("فشل تحميل بيانات المقال");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (!id) return <div className="p-8 text-center font-bold text-red-500">معرف المقال مفقود</div>;
  if (loading) return <div className="p-8 text-center font-bold text-slate-500">جاري التحميل...</div>;
  if (!initialData) return <div className="p-8 text-center font-bold text-red-500">حدث خطأ أو أن المقال غير موجود</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-amber-600 font-bold mb-4 transition-colors">
          <ArrowRight size={20} /> العودة للمدونة
        </Link>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">تعديل المقال</h1>
        <p className="text-slate-500 mt-2 font-medium">قم بتعديل بيانات المقال ومحتواه</p>
      </div>

      <BlogForm initialData={initialData} />
    </div>
  );
}

export default function EditBlogPostPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-slate-500">جاري التحميل...</div>}>
      <BlogEditContent />
    </Suspense>
  );
}
