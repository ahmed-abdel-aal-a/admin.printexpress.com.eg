"use client";

import React from "react";
import { ShoppingBag, Settings2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AbandonedCartsList from "./_components/AbandonedCartsList";
import AbandonedCartsSettingsView from "./_components/AbandonedCartsSettings";

export default function AbandonedCartsPage() {
  return (
    <div dir="rtl" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          السلات المتروكة
        </h1>
        <p className="text-slate-500">
          تابع السلات التي لم يكمل العملاء شراءها، وقم بإرسال تذكيرات لاسترجاعها وزيادة مبيعاتك.
        </p>
      </div>

      <Tabs dir="rtl" defaultValue="list" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-6">
          <TabsTrigger 
            value="list" 
            className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-all"
          >
            قائمة السلات
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-all flex items-center gap-2"
          >
            <Settings2 className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-0 outline-none">
          <AbandonedCartsList />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-0 outline-none">
          <AbandonedCartsSettingsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
