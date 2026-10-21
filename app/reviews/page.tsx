"use client";

import React, { useState } from 'react';
import { Review, ReviewSettings, ReviewFilterStatus, ReviewStatus } from './types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, CheckCircle, XCircle, Search, Clock, Image as ImageIcon, Filter, Settings2, MessagesSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Custom Switch/Toggle Component
function Switch({ checked, onCheckedChange, label, description }: { checked: boolean, onCheckedChange: (c: boolean) => void, label: string, description: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm transition-colors hover:border-amber-100">
      <div className="flex flex-col space-y-1 pl-6">
        <span className="font-bold text-slate-800">{label}</span>
        <span className="text-sm text-slate-500">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          checked ? "bg-amber-600" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
            checked ? "-translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

// Generate mock data safely without Date.now()
const generateMockReviews = (): Review[] => [
  {
    id: crypto.randomUUID(),
    customerName: 'أحمد محمود',
    stars: 5,
    text: 'منتج ممتاز جداً وتغليف رائع، شكراً لكم.',
    thumbnails: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80'],
    date: '2023-10-25',
    status: 'pending'
  },
  {
    id: crypto.randomUUID(),
    customerName: 'سارة خالد',
    stars: 4,
    text: 'جودة الطباعة ممتازة ولكن التوصيل تأخر يومين.',
    thumbnails: [],
    date: '2023-10-24',
    status: 'accepted'
  },
  {
    id: crypto.randomUUID(),
    customerName: 'محمد علي',
    stars: 1,
    text: 'المنتج وصل تالف وغير مطابق للمواصفات.',
    thumbnails: ['https://images.unsplash.com/photo-1594910114092-23c8eecb52a5?w=100&q=80'],
    date: '2023-10-23',
    status: 'rejected'
  }
];

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>(generateMockReviews());
  const [settings, setSettings] = useState<ReviewSettings>({
    isSystemEnabled: true,
    allowImages: true,
    manualReviewRequired: true,
  });
  const [filter, setFilter] = useState<ReviewFilterStatus>('all');

  const updateReviewStatus = (id: string, newStatus: ReviewStatus) => {
    setReviews(prev => prev.map(review => 
      review.id === id ? { ...review, status: newStatus } : review
    ));
  };

  const updateSetting = (key: keyof ReviewSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const filteredReviews = reviews.filter(r => filter === 'all' || r.status === filter);

  // Status Badge Component
  const StatusBadge = ({ status }: { status: ReviewStatus }) => {
    const statusConfig = {
      pending: { label: 'معلق', className: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
      accepted: { label: 'مقبول', className: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
      rejected: { label: 'مرفوض', className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", config.className)}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-8" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <MessagesSquare className="w-8 h-8 text-amber-600" />
            إدارة التقييمات
          </h1>
          <p className="text-slate-500 mt-2 text-sm">راجع تقييمات العملاء وقم بإدارتها للتحكم في ظهورها على المتجر.</p>
        </div>
      </div>

      <Tabs defaultValue="management" className="w-full" dir="rtl">
        <TabsList className="mb-6">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <MessagesSquare className="w-4 h-4" />
            إدارة التقييمات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            إعدادات النظام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 shadow-sm w-fit">
            <Filter className="w-5 h-5 text-slate-400 ml-2" />
            {(['all', 'pending', 'accepted', 'rejected'] as ReviewFilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  filter === status 
                    ? "bg-amber-100 text-amber-800" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {status === 'all' ? 'الكل' : status === 'pending' ? 'المعلقة' : status === 'accepted' ? 'المقبولة' : 'المرفوضة'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-6 py-4">العميل</th>
                    <th className="px-6 py-4">التقييم</th>
                    <th className="px-6 py-4 w-1/3">نص المراجعة</th>
                    <th className="px-6 py-4">الصور</th>
                    <th className="px-6 py-4">التاريخ</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {filteredReviews.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <Search className="w-10 h-10 text-slate-300" />
                            <p>لا توجد تقييمات مطابقة للفلتر الحالي.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredReviews.map((review) => (
                        <motion.tr 
                          key={review.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                            {review.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn("w-4 h-4", i < review.stars ? "fill-current" : "text-slate-200 fill-slate-200")} 
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <p className="line-clamp-2">{review.text}</p>
                          </td>
                          <td className="px-6 py-4">
                            {review.thumbnails.length > 0 ? (
                              <div className="flex -space-x-2 -space-x-reverse">
                                {review.thumbnails.map((thumb, idx) => (
                                  <img 
                                    key={idx} 
                                    src={thumb} 
                                    alt="مرفق التقييم" 
                                    className="w-8 h-8 rounded-md object-cover border-2 border-white shadow-sm"
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 inline-flex items-center gap-1 text-xs">
                                <ImageIcon className="w-3.5 h-3.5" />
                                لا يوجد
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                            {review.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={review.status} />
                          </td>
                          <td className="px-6 py-4 text-left whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {review.status !== 'accepted' && (
                                <button 
                                  onClick={() => updateReviewStatus(review.id, 'accepted')}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="قبول"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              )}
                              {review.status !== 'rejected' && (
                                <button 
                                  onClick={() => updateReviewStatus(review.id, 'rejected')}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="رفض"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 max-w-2xl">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-amber-600" />
              التحكم في التقييمات
            </h3>
            <div className="space-y-4">
              <Switch 
                checked={settings.isSystemEnabled}
                onCheckedChange={(v) => updateSetting('isSystemEnabled', v)}
                label="تفعيل نظام التقييمات بالكامل"
                description="عند الإغلاق، لن يتمكن العملاء من ترك أي تقييمات جديدة ولن تظهر التقييمات السابقة."
              />
              <Switch 
                checked={settings.allowImages}
                onCheckedChange={(v) => updateSetting('allowImages', v)}
                label="السماح بإرفاق صور"
                description="السماح للعملاء بإرفاق صور مع تقييماتهم للمنتجات."
              />
              <Switch 
                checked={settings.manualReviewRequired}
                onCheckedChange={(v) => updateSetting('manualReviewRequired', v)}
                label="المراجعة اليدوية للتقييمات"
                description="يجب الموافقة على التقييمات من قبل الإدارة قبل ظهورها للعامة."
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
