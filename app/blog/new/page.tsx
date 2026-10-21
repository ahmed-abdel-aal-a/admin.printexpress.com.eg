import React from "react";
import BlogForm from "@/components/BlogForm";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NewBlogPostPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-amber-600 font-bold mb-4 transition-colors">
          <ArrowRight size={20} /> العودة للمدونة
        </Link>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">إضافة مقال جديد</h1>
        <p className="text-slate-500 mt-2 font-medium">قم بصياغة مقال جديد وتنسيقه ليتناسب مع موقعك</p>
      </div>

      <BlogForm />
    </div>
  );
}
