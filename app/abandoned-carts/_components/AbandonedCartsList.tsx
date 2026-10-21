"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AbandonedCart, CartStatus, AbandonedCartsSettings } from "../types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Eye, MessageCircle, Mail, BellRing, Tag, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { rawFetcher, fetcher, apiClient } from "@/lib/api";
import toast from "react-hot-toast";

const formatPhoneForWhatsApp = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0020')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '20' + cleaned.substring(1);
  } else if (!cleaned.startsWith('20') && (cleaned.length === 10 || cleaned.length === 11)) {
    cleaned = '20' + cleaned;
  }
  return cleaned;
};

const statusConfig: Record<CartStatus, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-amber-100 text-amber-800 border-amber-200" },
  recovered: { label: "مسترجعة", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  lost: { label: "مفقودة", color: "bg-rose-100 text-rose-800 border-rose-200" },
};

export default function AbandonedCartsList() {
  const [filter, setFilter] = useState<CartStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: response, isLoading } = useSWR(`/v1/admin/abandoned-carts?status=${filter}&page=${currentPage}`, rawFetcher);
  const { data: settings } = useSWR<AbandonedCartsSettings>('/v1/admin/abandoned-carts/settings', fetcher);

  const carts: AbandonedCart[] = response?.data || [];
  const meta = response?.meta || { current_page: 1, last_page: 1 };
  const totalPages = meta.last_page || 1;

  const handleFilterChange = (newFilter: CartStatus | 'all') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleWhatsAppClick = (cart: AbandonedCart) => {
    if (!cart.customer_phone) return;
    
    let text = settings?.whatsapp_template || "مرحباً {{name}}، سلتك في انتظارك: {{url}}";
    
    text = text.replaceAll('{{name}}', cart.customer_name || 'عميلنا العزيز');
    text = text.replaceAll('{{url}}', cart.recovery_url || '');
    text = text.replaceAll('{{discountCode}}', cart.discount?.code || '');

    // Record contact history
    apiClient(`/v1/admin/abandoned-carts/${cart.id}/contact-history`, {
      method: 'POST',
      body: { type: 'whatsapp', status: 'sent' }
    }).catch(() => {});

    const phone = formatPhoneForWhatsApp(cart.customer_phone);
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  const handleEmailClick = (cart: AbandonedCart) => {
    if (!cart.customer_email) return;

    // Record contact history
    apiClient(`/v1/admin/abandoned-carts/${cart.id}/contact-history`, {
      method: 'POST',
      body: { type: 'email', status: 'sent' }
    }).catch(() => {});

    window.location.href = `mailto:${cart.customer_email}`;
  };

  const handlePushClick = async (cart: AbandonedCart) => {
    try {
      await apiClient(`/v1/admin/abandoned-carts/${cart.id}/push-notification`, {
        method: 'POST'
      });
      toast.success('تم إرسال إشعار المتصفح بنجاح');
    } catch (err: any) {
      toast.error(err?.message || 'فشل إرسال إشعار المتصفح');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => handleFilterChange('all')}
            className={filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600'}
          >
            الكل
          </Button>
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'} 
            onClick={() => handleFilterChange('pending')}
            className={filter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-600'}
          >
            قيد الانتظار
          </Button>
          <Button 
            variant={filter === 'recovered' ? 'default' : 'outline'} 
            onClick={() => handleFilterChange('recovered')}
            className={filter === 'recovered' ? 'bg-emerald-600 text-white' : 'text-slate-600'}
          >
            مسترجعة
          </Button>
          <Button 
            variant={filter === 'lost' ? 'default' : 'outline'} 
            onClick={() => handleFilterChange('lost')}
            className={filter === 'lost' ? 'bg-rose-600 text-white' : 'text-slate-600'}
          >
            مفقودة
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">نوع العميل</th>
                <th className="px-6 py-4">القيمة</th>
                <th className="px-6 py-4">تاريخ الترك</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : carts.map((cart) => (
                <tr key={cart.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {cart.customer_name || "غير معروف"}
                      {cart.discount && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px]" title="تم عرض خصم">
                          <Tag className="w-3 h-3" />
                          خصم
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{cart.customer_email || cart.customer_phone || "لا يوجد تواصل"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-xs">
                      {cart.customer_type === 'registered' ? 'مسجل' : cart.customer_type === 'guest' ? 'زائر (بيانات محفوظة)' : 'مجهول'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {cart.total_amount} ج.م
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs" suppressHydrationWarning>
                    {cart.abandoned_at ? format(new Date(cart.abandoned_at), 'PP p', { locale: ar }) : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[cart.status].color}`}>
                      {statusConfig[cart.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/abandoned-carts/view?id=${cart.id}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-slate-600 hover:text-amber-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-green-600 hover:bg-green-50" 
                        title="إرسال واتساب" 
                        disabled={!cart.customer_phone}
                        onClick={() => handleWhatsAppClick(cart)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                        title="إرسال بريد" 
                        disabled={!cart.customer_email}
                        onClick={() => handleEmailClick(cart)}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-amber-600 hover:bg-amber-50" 
                        title="إشعار متصفح" 
                        disabled={!cart.has_push_permission}
                        onClick={() => handlePushClick(cart)}
                      >
                        <BellRing className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && carts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    لا توجد سلات متروكة تطابق الفلتر الحالي.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              صفحة {currentPage} من {totalPages}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="gap-1 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="gap-1 text-slate-600"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

