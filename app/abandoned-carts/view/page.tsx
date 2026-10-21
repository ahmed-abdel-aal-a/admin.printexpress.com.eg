"use client";

import React, { useState, ComponentProps, Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { ar } from "date-fns/locale";
import { ArrowRight, ShoppingCart, Clock, Phone, Mail, User, BellRing, MessageCircle, Tag, Check, Copy, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AbandonedCart, AbandonedCartsSettings } from "../types";
import useSWR from "swr";
import { fetcher, apiClient } from "@/lib/api";
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

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fill?: boolean;
}

function SafeImage({ src, alt, fill, className, ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src as string);
  return (
    <img 
      {...props}
      src={imgSrc} 
      alt={alt}
      className={fill ? `absolute inset-0 w-full h-full ${className || ''}` : className}
      onError={() => setImgSrc("https://picsum.photos/seed/fallback/100/100")}
    />
  );
}

function CartDetailsContent({ id }: { id: string }) {
  const { data: cart, mutate, isLoading } = useSWR<AbandonedCart>(`/v1/admin/abandoned-carts/${id}`, fetcher);
  const { data: settings } = useSWR<AbandonedCartsSettings>('/v1/admin/abandoned-carts/settings', fetcher);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateDiscount = async () => {
    setIsGenerating(true);
    try {
      await apiClient(`/v1/admin/abandoned-carts/${id}/generate-discount`, { method: 'POST' });
      mutate();
    } catch (error) {
      console.error(error);
      alert("فشل توليد الخصم");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (cart?.recovery_url) {
      navigator.clipboard.writeText(cart.recovery_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppClick = () => {
    if (!cart?.customer_phone) return;
    let text = settings?.whatsapp_template || "مرحباً {{name}}، سلتك في انتظارك: {{url}}";
    text = text.replaceAll('{{name}}', cart.customer_name || 'عميلنا العزيز');
    text = text.replaceAll('{{url}}', cart.recovery_url || '');
    text = text.replaceAll('{{discountCode}}', cart.discount?.code || '');

    // Record contact history
    apiClient(`/v1/admin/abandoned-carts/${cart.id}/contact-history`, {
      method: 'POST',
      body: { type: 'whatsapp', status: 'sent' }
    }).then(() => mutate()).catch(() => {});

    const phone = formatPhoneForWhatsApp(cart.customer_phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmailClick = () => {
    if (!cart?.customer_email) return;

    // Record contact history
    apiClient(`/v1/admin/abandoned-carts/${cart.id}/contact-history`, {
      method: 'POST',
      body: { type: 'email', status: 'sent' }
    }).then(() => mutate()).catch(() => {});

    window.location.href = `mailto:${cart.customer_email}`;
  };

  const handlePushClick = async () => {
    if (!cart?.id) return;
    try {
      await apiClient(`/v1/admin/abandoned-carts/${cart.id}/push-notification`, {
        method: 'POST'
      });
      toast.success('تم إرسال إشعار المتصفح بنجاح');
      mutate();
    } catch (err: any) {
      toast.error(err?.message || 'فشل إرسال إشعار المتصفح');
    }
  };

  const getStatusBadge = () => {
    switch(cart?.status) {
      case 'pending': return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-sm font-medium">قيد الانتظار</span>;
      case 'recovered': return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-sm font-medium">مسترجعة</span>;
      case 'lost': return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-sm font-medium">مفقودة</span>;
      default: return null;
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500">جاري تحميل السلة...</div>;
  if (!cart) return <div className="p-12 text-center text-rose-500">خطأ في تحميل بيانات السلة</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/abandoned-carts">
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              تفاصيل السلة #{cart.id}
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2" suppressHydrationWarning>
              <Clock className="w-4 h-4" /> 
              تركت في {cart.abandoned_at ? format(new Date(cart.abandoned_at), 'PP p', { locale: ar }) : ''}
            </p>
          </div>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4">معلومات العميل</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-700">
                <User className="w-5 h-5 text-slate-400" />
                <span className="font-medium">{cart.customer_name || 'غير متوفر'}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mr-auto">
                  {cart.customer_type === 'registered' ? 'مسجل' : cart.customer_type === 'guest' ? 'زائر' : 'مجهول'}
                </span>
              </div>
              {cart.customer_phone && (
                <div className="flex items-center gap-3 text-slate-700">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <span dir="ltr">{cart.customer_phone}</span>
                </div>
              )}
              {cart.customer_email && (
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span>{cart.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4">إجراءات الاسترجاع</h3>
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" />
                الخصم التحفيزي
              </h4>
              {cart.discount ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                    <span className="font-mono text-amber-700 font-bold">{cart.discount.code}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      {cart.discount.type === 'percentage' ? `${cart.discount.value}% خصم` : `${cart.discount.value} ج.م خصم`}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">الكود جاهز للإرسال في القوالب التلقائية</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">لم يتم توليد كود خصم لهذه السلة.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={generateDiscount}
                    disabled={isGenerating || settings?.enable_discounts === false}
                  >
                    {isGenerating ? "جاري التوليد..." : "توليد كود خصم خاص"}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full justify-start gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white" 
                disabled={!cart.customer_phone}
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="w-5 h-5" />
                إرسال رسالة واتساب
              </Button>
              <Button 
                className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={!cart.customer_email}
                onClick={handleEmailClick}
              >
                <Mail className="w-5 h-5" />
                إرسال بريد إلكتروني
              </Button>
              <Button 
                className="w-full justify-start gap-3 bg-amber-600 hover:bg-amber-700 text-white" 
                disabled={!cart.has_push_permission}
                onClick={handlePushClick}
              >
                <BellRing className="w-5 h-5" />
                إرسال إشعار للمتصفح (Push)
              </Button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">رابط الاسترجاع السريع:</p>
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <input 
                  type="text" 
                  readOnly 
                  value={cart.recovery_url} 
                  className="bg-transparent border-none text-xs w-full text-slate-600 focus:outline-none" 
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1 px-2"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? <span className="text-emerald-600">تم النسخ</span> : "نسخ"}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-4">سجل التواصل</h3>
            {cart.contact_history && cart.contact_history.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-y-0 before:right-2.5 before:w-0.5 before:bg-slate-100">
                {cart.contact_history.map((ev) => (
                  <div key={ev.id} className="relative flex gap-4 pl-4 items-start">
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-amber-500 flex-shrink-0 z-10 mt-0.5"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {ev.type === 'whatsapp' ? 'واتساب' : ev.type === 'email' ? 'بريد إلكتروني' : ev.type === 'push' ? 'إشعار متصفح' : 'رسالة قصيرة'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1" suppressHydrationWarning>{ev.sent_at ? format(new Date(ev.sent_at), 'PP p', { locale: ar }) : ''}</p>
                      <div className="mt-1">
                        {ev.status === 'delivered' || ev.status === 'clicked' ? (
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {ev.status === 'clicked' ? 'تم النقر' : 'تم الاستلام'}</span>
                        ) : ev.status === 'failed' ? (
                          <span className="text-[10px] text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> فشل الإرسال</span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">تم الإرسال</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">لم يتم إرسال أي تذكيرات بعد.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">محتويات السلة</h3>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-bold">
                {cart.items?.length || 0} منتجات
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {cart.items?.map((item) => (
                <div key={item.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 relative">
                    <SafeImage src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-base">{item.name}</h4>
                      {item.is_sale_item && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">تخفيضات</span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mt-1">الكمية: {item.quantity}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-bold text-slate-800 text-lg">{item.price * item.quantity} ج.م</p>
                    {item.quantity > 1 && (
                      <p className="text-slate-400 text-xs mt-1">{item.price} ج.م للوحدة</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 flex justify-between items-center border-t border-slate-200">
              <span className="text-slate-600 font-medium text-lg">الإجمالي</span>
              <span className="font-bold text-2xl text-slate-800">{cart.total_amount} ج.م</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbandonedCartDetailsWrapper() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <ShoppingCart className="w-16 h-16 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-800">السلة غير موجودة</h2>
        <p className="text-slate-500">لم نتمكن من العثور على السلة المتروكة المطلوبة.</p>
        <Link href="/abandoned-carts">
          <Button variant="outline">العودة للقائمة</Button>
        </Link>
      </div>
    );
  }

  return <CartDetailsContent id={id} />;
}

export default function AbandonedCartDetailsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-slate-500">جاري التحميل...</div>}>
      <AbandonedCartDetailsWrapper />
    </Suspense>
  );
}

