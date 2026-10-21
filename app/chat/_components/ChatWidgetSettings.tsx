"use client";

import { useState } from "react";
import { useChatCenter } from "../_context/ChatCenterContext";
import { apiClient } from "@/lib/api";
import { useSWRConfig } from "swr";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Phone, Palette, CheckCircle2 } from "lucide-react";

export default function ChatWidgetSettings() {
  const {
    isMessageEnabled,
    setIsMessageEnabled,
    messageText,
    setMessageText,
    displayLocation,
    setDisplayLocation,
    themeColor,
    setThemeColor,
    whatsappNumber,
    setWhatsappNumber,
    whatsappEnabled,
    setWhatsappEnabled,
    whatsappDefaultMessage,
    setWhatsappDefaultMessage,
  } = useChatCenter();

  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutate } = useSWRConfig();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await apiClient('/v1/admin/chat-center/settings', {
        method: 'PUT',
        body: {
          isMessageEnabled,
          messageText,
          displayLocation,
          themeColor,
          whatsappNumber,
          whatsappEnabled,
          whatsappDefaultMessage,
        }
      });
      setIsSaved(true);
      mutate('/v1/admin/chat-center/settings');
      setTimeout(() => setIsSaved(false), 2500);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12" dir="rtl">
      {/* 1. WhatsApp Settings Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">إعدادات التواصل عبر واتساب (WhatsApp)</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              حدد رقم الواتساب الرسمي الذي يتوجه إليه العميل عند الضغط على زر واتساب في المتجر وصفحة المنتج.
            </p>
          </div>
        </div>

        <div className="space-y-5 border-t border-slate-100 pt-5">
          {/* Toggle WhatsApp */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold text-slate-800">تفعيل زر الواتساب في المتجر</Label>
              <p className="text-sm text-slate-500">إظهار الزر العائم وقائمة التواصل السريع عبر واتساب للعملاء.</p>
            </div>
            <button
              type="button"
              onClick={() => setWhatsappEnabled(!whatsappEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                whatsappEnabled ? "bg-emerald-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  whatsappEnabled ? "-translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className={`space-y-4 transition-opacity duration-200 ${whatsappEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            {/* WhatsApp Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp-num" className="font-semibold text-slate-700">رقم الهاتف للواتساب</Label>
              <div className="relative">
                <Input
                  id="whatsapp-num"
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="مثال: 01012345678 أو 201012345678"
                  className="bg-slate-50 focus:bg-white text-left font-mono font-bold"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-slate-400">
                يمكنك كتابة الرقم بالصيغة المحلية (01xxxxxxxxx) أو الدولية (201xxxxxxxxx). سيقوم النظام بتهيئته تلقائياً للفتح في تطبيق واتساب.
              </p>
            </div>

            {/* Default Message */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp-default-msg" className="font-semibold text-slate-700">الرسالة التلقائية الافتراضية</Label>
              <Textarea
                id="whatsapp-default-msg"
                value={whatsappDefaultMessage}
                onChange={(e) => setWhatsappDefaultMessage(e.target.value)}
                placeholder="مرحباً، أود الاستفسار عن..."
                className="resize-none h-20 bg-slate-50 focus:bg-white text-sm"
              />
              <p className="text-xs text-slate-400">
                الرسالة التي ستكون مكتوبة مسبقاً في شاشة الدردشة عند فتح تطبيق واتساب.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Welcome Message Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">الرسالة الترحيبية الثابتة للدردشة المباشرة</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              قم بإعداد الرسالة التي تظهر للعملاء عند فتح نافذة المحادثة المباشرة في المتجر.
            </p>
          </div>
        </div>

        <div className="space-y-5 border-t border-slate-100 pt-5">
          {/* Toggle Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold text-slate-800">تفعيل الرسالة الثابتة</Label>
              <p className="text-sm text-slate-500">إظهار الرسالة تلقائياً عند فتح المحادثة.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMessageEnabled(!isMessageEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isMessageEnabled ? "bg-amber-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isMessageEnabled ? "-translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Message Content */}
          <div className={`space-y-4 transition-opacity duration-200 ${isMessageEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="space-y-2">
              <Label htmlFor="welcome-msg" className="font-semibold text-slate-700">نص الرسالة</Label>
              <Textarea
                id="welcome-msg"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="اكتب رسالتك الترحيبية هنا..."
                className="resize-none h-24 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Display Location */}
            <div className="space-y-3">
              <Label className="font-semibold text-slate-700">مكان العرض</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors flex-1">
                  <input
                    type="radio"
                    name="displayLocation"
                    value="chat_only"
                    checked={displayLocation === "chat_only"}
                    onChange={(e) => setDisplayLocation(e.target.value)}
                    className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-slate-700">في المحادثة فقط</span>
                </label>
                
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors flex-1">
                  <input
                    type="radio"
                    name="displayLocation"
                    value="chat_and_faq"
                    checked={displayLocation === "chat_and_faq"}
                    onChange={(e) => setDisplayLocation(e.target.value)}
                    className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-slate-700">في المحادثة والأسئلة الشائعة</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Theme & Colors Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">مظهر وسمة نافذة الدردشة</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              تحديد اللون الرئيسي لعناصر وأزرار الدردشة في واجهة المتجر.
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={themeColor || "#f59e0b"}
              onChange={(e) => setThemeColor(e.target.value)}
              className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
            />
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">اللون الأساسي للنافذة</Label>
              <Input
                type="text"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-36 font-mono text-xs uppercase"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSubmitting}
          className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-2.5 rounded-xl shadow-md transition-all font-bold flex items-center gap-2"
        >
          {isSubmitting ? (
            "جاري الحفظ..."
          ) : isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>تم حفظ الإعدادات بنجاح!</span>
            </>
          ) : (
            "حفظ جميع التغييرات"
          )}
        </Button>
      </div>
    </div>
  );
}
