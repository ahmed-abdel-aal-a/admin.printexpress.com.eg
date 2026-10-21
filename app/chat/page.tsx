"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, HelpCircle, Settings } from "lucide-react";
import LiveChat from "./_components/LiveChat";
import FAQManager from "./_components/FAQManager";
import ChatWidgetSettings from "./_components/ChatWidgetSettings";
import { ChatCenterProvider } from "./_context/ChatCenterContext";

export default function ChatCenterPage() {
  return (
    <ChatCenterProvider>
      <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100vh-6rem)] max-h-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">مركز المحادثات</h1>
          <p className="text-slate-500 text-sm mt-1">
            إدارة المحادثات المباشرة مع العملاء وتخصيص الأسئلة الشائعة
          </p>
        </div>
      </div>

      <Tabs defaultValue="live" className="flex-1 flex flex-col min-h-0" dir="rtl">
        <TabsList className="w-full max-w-2xl flex overflow-x-auto whitespace-nowrap mb-6 bg-white border border-slate-200 shadow-sm rounded-xl p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 shrink-0">
          <TabsTrigger value="live" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
            <MessageCircle className="w-4 h-4" />
            <span>المحادثات المباشرة</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
            <HelpCircle className="w-4 h-4" />
            <span>الأسئلة الشائعة</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm">
            <Settings className="w-4 h-4" />
            <span>إعدادات الواجهة</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="flex-1 min-h-0 m-0 outline-none">
          <LiveChat />
        </TabsContent>

        <TabsContent value="faq" className="flex-1 min-h-0 m-0 outline-none overflow-y-auto custom-scrollbar px-1">
          <FAQManager />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 min-h-0 m-0 outline-none overflow-y-auto custom-scrollbar px-1">
          <ChatWidgetSettings />
        </TabsContent>
      </Tabs>
    </div>
    </ChatCenterProvider>
  );
}
