"use client";

import React, { useState, useEffect } from "react";
import { AbandonedCartsSettings } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useSWR from "swr";
import { fetcher, apiClient } from "@/lib/api";

export default function AbandonedCartsSettingsView() {
  const { data: initialSettings, isLoading, mutate } = useSWR<AbandonedCartsSettings>('/v1/admin/abandoned-carts/settings', fetcher);
  const [settings, setSettings] = useState<AbandonedCartsSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleNumberChange = (key: keyof AbandonedCartsSettings, value: string) => {
    if (!settings) return;
    if (value === "") {
      setSettings((prev) => ({ ...prev!, [key]: "" as unknown as number }));
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setSettings((prev) => ({ ...prev!, [key]: Math.max(0, num) }));
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await apiClient('/v1/admin/abandoned-carts/settings', {
        method: 'PUT',
        body: settings
      });
      mutate(settings);
      alert("تم حفظ الإعدادات بنجاح");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) return <div className="p-12 text-center text-slate-500">جاري تحميل الإعدادات...</div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">إعدادات التوقيت والتكرار</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="abandonedMinutes" className="text-slate-700">اعتبار السلة متروكة بعد (دقيقة)</Label>
            <Input 
              id="abandonedMinutes" 
              type="number" 
              value={settings.consider_abandoned_after_minutes || ''}
              onChange={(e) => handleNumberChange('consider_abandoned_after_minutes', e.target.value)}
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">الوقت المستغرق لتصنيف السلة كمتروكة بعد آخر تحديث لها.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequencyCapping" className="text-slate-700">منع الإزعاج (Frequency Capping) - بالساعات</Label>
            <Input 
              id="frequencyCapping" 
              type="number" 
              value={settings.frequency_capping_hours || ''}
              onChange={(e) => handleNumberChange('frequency_capping_hours', e.target.value)}
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">الحد الأدنى للوقت بين كل رسالة تذكير وأخرى لنفس العميل لتجنب الإزعاج.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">إشعارات المتصفح (Web Push Notifications)</h3>
          <div className="flex items-center space-x-2 space-x-reverse">
            <input 
              type="checkbox" 
              id="enablePush" 
              checked={settings.enable_push_notifications}
              onChange={(e) => setSettings({...settings, enable_push_notifications: e.target.checked})}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <Label htmlFor="enablePush" className="text-sm font-medium text-slate-700 cursor-pointer">تفعيل الإشعارات</Label>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pushTitle" className="text-slate-700">عنوان الإشعار</Label>
            <Input 
              id="pushTitle" 
              value={settings.push_notification_title || ''}
              onChange={(e) => setSettings({...settings, push_notification_title: e.target.value})}
              disabled={!settings.enable_push_notifications}
              className="bg-slate-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pushBody" className="text-slate-700">محتوى الإشعار</Label>
            <Textarea 
              id="pushBody" 
              value={settings.push_notification_body || ''}
              onChange={(e) => setSettings({...settings, push_notification_body: e.target.value})}
              disabled={!settings.enable_push_notifications}
              className="bg-slate-50 min-h-[100px]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">الخصومات التحفيزية (Incentive Discounts)</h3>
            <p className="text-sm text-slate-500 mt-1">توليد أكواد خصم تلقائية لتشجيع العميل على إكمال الشراء.</p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <input 
              type="checkbox" 
              id="enableDiscounts" 
              checked={settings.enable_discounts}
              onChange={(e) => setSettings({...settings, enable_discounts: e.target.checked})}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <Label htmlFor="enableDiscounts" className="text-sm font-medium text-slate-700 cursor-pointer">تفعيل الخصومات</Label>
          </div>
        </div>

        {settings.enable_discounts && (
          <div className="space-y-6 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700">نوع الخصم</Label>
                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <button 
                    type="button"
                    onClick={() => setSettings({...settings, discount_type: 'percentage'})}
                    className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${settings.discount_type === 'percentage' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    نسبة مئوية (%)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSettings({...settings, discount_type: 'fixed'})}
                    className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${settings.discount_type === 'fixed' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    مبلغ ثابت
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue" className="text-slate-700">قيمة الخصم</Label>
                <div className="relative">
                  <Input 
                    id="discountValue" 
                    type="number" 
                    value={settings.discount_value || ''}
                    onChange={(e) => handleNumberChange('discount_value', e.target.value)}
                    className="bg-slate-50 pl-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                    {settings.discount_type === 'percentage' ? '%' : 'ج.م'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-4">
              <h4 className="font-bold text-amber-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                الحماية من الاستغلال (Anti-Abuse Rules)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="antiAbuseDays" className="text-amber-900">فترة منع التكرار (بالأيام)</Label>
                  <Input 
                    id="antiAbuseDays" 
                    type="number" 
                    value={settings.anti_abuse_days || ''}
                    onChange={(e) => handleNumberChange('anti_abuse_days', e.target.value)}
                    className="bg-white border-amber-200"
                  />
                  <p className="text-xs text-amber-700">لن يحصل العميل على كود خصم جديد لترك السلة إلا بعد مرور هذه المدة.</p>
                </div>

                <div className="space-y-2 flex flex-col justify-center pt-6">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input 
                      type="checkbox" 
                      id="excludeSaleItems" 
                      checked={settings.exclude_sale_items}
                      onChange={(e) => setSettings({...settings, exclude_sale_items: e.target.checked})}
                      className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                    />
                    <Label htmlFor="excludeSaleItems" className="text-sm font-medium text-amber-900 cursor-pointer">استثناء المنتجات المخفضة (Sale Items)</Label>
                  </div>
                  <p className="text-xs text-amber-700 pr-6">لن يتم تطبيق كود الخصم على المنتجات التي عليها عروض مسبقاً.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">قوالب الرسائل (WhatsApp & Email)</h3>
        <p className="text-sm text-slate-500 mb-6">استخدم المتغيرات التالية: {'{{name}}'} للاسم، و {'{{url}}'} لرابط استرجاع السلة، و {'{{discountCode}}'} لكود الخصم (إن وجد).</p>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="waTemplate" className="text-slate-700">قالب رسالة الواتساب</Label>
            <Textarea 
              id="waTemplate" 
              value={settings.whatsapp_template || ''}
              onChange={(e) => setSettings({...settings, whatsapp_template: e.target.value})}
              className="bg-slate-50 min-h-[100px]"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <Label htmlFor="emailSubject" className="text-slate-700">عنوان البريد الإلكتروني</Label>
              <Input 
                id="emailSubject" 
                value={settings.email_subject || ''}
                onChange={(e) => setSettings({...settings, email_subject: e.target.value})}
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailTemplate" className="text-slate-700">قالب البريد الإلكتروني</Label>
              <Textarea 
                id="emailTemplate" 
                value={settings.email_template || ''}
                onChange={(e) => setSettings({...settings, email_template: e.target.value})}
                className="bg-slate-50 min-h-[150px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8"
        >
          {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>
    </div>
  );
}

