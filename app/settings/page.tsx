"use client";

import React, { useState, useEffect } from "react";
import {
  Settings, Truck, CreditCard, Bell, User, Shield, Save, MapPin, Building,
  CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Package, X, KeyRound, Loader2,
  Printer, Calculator, HelpCircle, Info, Percent, Sparkles, Layers, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/lib/services/settings";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast, { Toaster } from 'react-hot-toast';

type TabId = "shipping" | "general" | "payment" | "notifications" | "security";

// --- Zod Schemas ---
const credentialsSchemaMap = {
  bosta: z.object({ api_key: z.string().min(5, "مفتاح الربط مطلوب") }),
  aramex: z.object({ username: z.string().min(1, "مطلوب"), password: z.string().min(1, "مطلوب"), account_number: z.string().min(1, "مطلوب"), pin: z.string().min(1, "مطلوب") }),
  mylerz: z.object({ api_key: z.string().min(1, "مطلوب"), merchant_id: z.string().min(1, "مطلوب") }),
  sprint: z.object({ api_key: z.string().min(1, "مطلوب"), merchant_id: z.string().min(1, "مطلوب") }),
  r2s: z.object({ api_key: z.string().min(1, "مطلوب"), merchant_id: z.string().min(1, "مطلوب") }),
  kashier: z.object({ merchant_id: z.string().min(1, "مطلوب"), api_key: z.string().optional(), webhook_secret: z.string().optional(), mode: z.enum(["test", "live"]).default("test") }),
  paymob: z.object({ api_key: z.string().min(1, "مطلوب"), merchant_id: z.string().min(1, "مطلوب") }),
  fawry: z.object({ api_key: z.string().min(1, "مطلوب"), merchant_id: z.string().min(1, "مطلوب") }),
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("shipping");
  
  // Queries
  const { data: generalSettings, isLoading: isLoadingGeneral } = useQuery({ queryKey: ["settings", "general"], queryFn: settingsApi.getGeneralSettings });
  const { data: companies, isLoading: isLoadingCompanies } = useQuery({ queryKey: ["settings", "shipping-companies"], queryFn: settingsApi.getShippingCompanies });
  const { data: zones, isLoading: isLoadingZones } = useQuery({ queryKey: ["settings", "shipping-zones"], queryFn: settingsApi.getShippingZones });
  const { data: gateways, isLoading: isLoadingGateways } = useQuery({ queryKey: ["settings", "payment-gateways"], queryFn: settingsApi.getPaymentGateways });

  const isLoading = isLoadingGeneral || isLoadingCompanies || isLoadingZones || isLoadingGateways;

  // Local state for UI changes before saving
  const [prevGeneralSettings, setPrevGeneralSettings] = useState<any>(null);
  const [localSettings, setLocalSettings] = useState<any>({});
  if (generalSettings && generalSettings !== prevGeneralSettings) {
    setPrevGeneralSettings(generalSettings);
    setLocalSettings(generalSettings);
  }

  const [prevZones, setPrevZones] = useState<any>(null);
  const [localZones, setLocalZones] = useState<any[]>([]);
  if (zones && zones !== prevZones) {
    setPrevZones(zones);
    setLocalZones(zones);
  }

  // Simulation state for interactive deposit testing
  const [simPrintingTotal, setSimPrintingTotal] = useState<number>(300);
  const [simRetailTotal, setSimRetailTotal] = useState<number>(100);
  const [simShippingCost, setSimShippingCost] = useState<number>(50);
  const [simCouponDiscount, setSimCouponDiscount] = useState<number>(0);

  // Mutations
  const updateGeneralMutation = useMutation({
    mutationFn: settingsApi.updateGeneralSettings,
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات بنجاح');
      queryClient.invalidateQueries({ queryKey: ["settings", "general"] });
    },
    onError: () => toast.error('حدث خطأ أثناء الحفظ')
  });

  const updateZonesMutation = useMutation({
    mutationFn: settingsApi.updateShippingZones,
    onSuccess: () => {
      toast.success('تم تحديث تسعير المناطق');
      queryClient.invalidateQueries({ queryKey: ["settings", "shipping-zones"] });
    },
    onError: () => toast.error('حدث خطأ أثناء حفظ التسعير')
  });

  const toggleCompanyMutation = useMutation({
    mutationFn: ({ code, isActive }: { code: string, isActive: boolean }) => settingsApi.updateShippingCompany(code, { is_active: isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "shipping-companies"] }),
  });

  const toggleGatewayMutation = useMutation({
    mutationFn: ({ code, isActive }: { code: string, isActive: boolean }) => settingsApi.updatePaymentGateway(code, { is_active: isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "payment-gateways"] }),
  });

  const updateCredentialsMutation = useMutation({
    mutationFn: ({ code, type, credentials }: { code: string, type: "shipping" | "payment", credentials: any }) => {
      if (type === "shipping") return settingsApi.updateShippingCompany(code, { credentials });
      return settingsApi.updatePaymentGateway(code, { credentials });
    },
    onSuccess: () => {
      toast.success('تم حفظ بيانات الربط بنجاح');
      closeConfigModal();
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error('تأكد من صحة البيانات')
  });

  // Modal State
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configType, setConfigType] = useState<"shipping" | "payment">("shipping");
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Record<string, any>>({
    resolver: async (data) => {
      if (!selectedEntity || !(selectedEntity.code in credentialsSchemaMap)) {
        return { values: data, errors: {} };
      }
      const schema = credentialsSchemaMap[selectedEntity.code as keyof typeof credentialsSchemaMap];
      const result = schema.safeParse(data);
      if (result.success) {
        return { values: result.data, errors: {} };
      }
      const formErrors: Record<string, any> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        formErrors[path] = { type: "manual", message: issue.message };
      });
      return { values: {}, errors: formErrors };
    }
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openConfigModal = (entity: any, type: "shipping" | "payment") => {
    setSelectedEntity(entity);
    setConfigType(type);
    reset(entity.credentials || {});
    setConfigModalOpen(true);
  };

  const closeConfigModal = () => {
    setConfigModalOpen(false);
    setSelectedEntity(null);
    reset({});
  };

  const onCredentialsSubmit = (data: any) => {
    if (!selectedEntity) return;
    updateCredentialsMutation.mutate({ code: selectedEntity.code, type: configType, credentials: data });
  };

  const handleGlobalSave = () => {
    updateGeneralMutation.mutate(localSettings);
    updateZonesMutation.mutate(localZones);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 lg:p-8 font-sans" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">الإعدادات</h1>
          <p className="text-slate-500 font-medium text-sm">إدارة إعدادات المتجر والشحن والمدفوعات</p>
        </div>
        <button 
          onClick={handleGlobalSave}
          disabled={updateGeneralMutation.isPending || updateZonesMutation.isPending}
          className="bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-6 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50"
        >
          {updateGeneralMutation.isPending || updateZonesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>حفظ التغييرات العامة</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sticky top-6">
            <nav className="flex flex-col gap-1">
              {([
                { id: "shipping", label: "إعدادات الشحن", icon: Truck },
                { id: "payment", label: "الدفع", icon: CreditCard },
                { id: "general", label: "عام", icon: Settings },
                { id: "notifications", label: "الإشعارات", icon: Bell },
                { id: "security", label: "الأمان والصلاحيات", icon: Shield },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm w-full text-right",
                    activeTab === tab.id ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "shipping" && (
            <div className="space-y-6">
              {/* Shipping Companies */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Truck className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">شركات الشحن (مصر)</h2>
                    <p className="text-sm text-slate-500 font-medium">قم بتفعيل وربط شركات الشحن المحلية</p>
                  </div>
                </div>
                <div>
                  {companies?.map((company: any, index: number) => (
                    <div key={company.id} className={cn("p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors", index !== companies.length - 1 && "border-b border-slate-100", company.is_active ? "bg-white" : "bg-slate-50/50")}>
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 text-slate-400 font-bold text-sm">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900">{company.name}</h3>
                            {company.is_active && company.is_configured && (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" /> متصل
                              </span>
                            )}
                            {company.is_active && !company.is_configured && (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                <AlertCircle className="w-3 h-3" /> يحتاج إعداد
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 max-w-md">{company.description}</p>
                          {company.cod_supported && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 w-fit px-2 py-1 rounded-md">
                              <CreditCard className="w-3.5 h-3.5" /> يدعم الدفع عند الاستلام
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <button onClick={() => openConfigModal(company, "shipping")} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          الإعدادات
                        </button>
                        <button onClick={() => toggleCompanyMutation.mutate({ code: company.code, isActive: !company.is_active })} className="flex items-center gap-2" disabled={toggleCompanyMutation.isPending}>
                          {company.is_active ? <ToggleRight className="w-10 h-10 text-amber-500" /> : <ToggleLeft className="w-10 h-10 text-slate-300 hover:text-slate-400 transition-colors" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Methods (Standard & Express) */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Truck className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">طرق وخيارات الشحن (الشحن العادي والسريع)</h2>
                    <p className="text-sm text-slate-500 font-medium">حدد الشركة المسؤولة عن كل نوع وقيمة الرسوم الإضافية للشحن السريع</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Standard Shipping Card */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs">📦 شحن عادي</span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">مفعل افتراضياً</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">يعتمد على التكلفة الأساسية المحددة لكل محافظة في جدول تسعير المناطق أدناه.</p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">شركة الشحن المسندة للشحن العادي</label>
                          <select
                            value={localSettings.standard_shipping_company || "bosta"}
                            onChange={(e) => setLocalSettings((s: any) => ({ ...s, standard_shipping_company: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer"
                          >
                            {companies?.map((c: any) => (
                              <option key={c.id} value={c.code}>{c.name} {c.is_active ? "(مفعلة)" : "(غير مفعلة)"}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">مدة التوصيل الموضحة للعميل</label>
                          <input
                            type="text"
                            value={localSettings.standard_shipping_delivery_time || ""}
                            onChange={(e) => setLocalSettings((s: any) => ({ ...s, standard_shipping_delivery_time: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 outline-none"
                            placeholder="خلال 2 - 4 أيام عمل"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Express Shipping Card */}
                  <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-200/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg font-bold text-xs">⚡ شحن سريع (توصيل فوري)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLocalSettings((s: any) => ({ ...s, express_shipping_enabled: !s.express_shipping_enabled }))}
                        >
                          {localSettings.express_shipping_enabled ? (
                            <ToggleRight className="w-9 h-9 text-amber-500" />
                          ) : (
                            <ToggleLeft className="w-9 h-9 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">يتيح للعميل اختيار توصيل أسرع مقابل رسوم إضافية تضاف على سعر شحن المحافظة.</p>

                      <div className={cn("space-y-3 transition-opacity", localSettings.express_shipping_enabled ? "opacity-100" : "opacity-50 pointer-events-none")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ الإضافي للشحن السريع</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={localSettings.express_shipping_fee ?? ""}
                                onChange={(e) => setLocalSettings((s: any) => ({ ...s, express_shipping_fee: e.target.value === "" ? 0 : Number(e.target.value) }))}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 outline-none pr-10"
                                placeholder="35"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">ج.م</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">الشركة المسندة للشحن السريع</label>
                            <select
                              value={localSettings.express_shipping_company || "bosta"}
                              onChange={(e) => setLocalSettings((s: any) => ({ ...s, express_shipping_company: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer"
                            >
                              {companies?.map((c: any) => (
                                <option key={c.id} value={c.code}>{c.name} {c.is_active ? "(مفعلة)" : "(غير مفعلة)"}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">مدة التوصيل الموضحة للعميل</label>
                          <input
                            type="text"
                            value={localSettings.express_shipping_delivery_time || ""}
                            onChange={(e) => setLocalSettings((s: any) => ({ ...s, express_shipping_delivery_time: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 outline-none"
                            placeholder="خلال 24 - 48 ساعة"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Rates */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">تسعير الشحن حسب المحافظة</h2>
                    <p className="text-sm text-slate-500 font-medium">حدد تكلفة الشحن الأساسية لكل محافظة في مصر</p>
                  </div>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-right border-collapse min-w-[400px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-sm">
                        <th className="pb-3 font-semibold">المحافظة</th>
                        <th className="pb-3 font-semibold w-44">تكلفة الشحن (جنيه)</th>
                        <th className="pb-3 font-semibold w-44">مدة التوصيل (أيام)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localZones.map((zone: any, i: number) => (
                        <tr key={zone.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-4 font-bold text-slate-800">{zone.name}</td>
                          <td className="py-4">
                            <div className="relative">
                              <input 
                                type="number" 
                                value={zone.rate}
                                onChange={(e) => setLocalZones(prev => {
                                  const newZones = [...prev];
                                  newZones[i].rate = e.target.value === "" ? 0 : Number(e.target.value);
                                  return newZones;
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none pr-12"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="relative">
                              <input 
                                type="text" 
                                placeholder="مثال: 2-3 أيام"
                                value={zone.delivery_days || ""}
                                onChange={(e) => setLocalZones(prev => {
                                  const newZones = [...prev];
                                  newZones[i].delivery_days = e.target.value;
                                  return newZones;
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-slate-900 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Free Shipping & Payment Quick Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><Package className="w-5 h-5" /></div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">الشحن المجاني</h2>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">تحفيز العملاء بحد أدنى للطلب للشحن المجاني</p>
                      </div>
                    </div>
                    <button onClick={() => setLocalSettings((s: any) => ({ ...s, free_shipping_enabled: !s.free_shipping_enabled }))}>
                      {localSettings.free_shipping_enabled ? <ToggleRight className="w-10 h-10 text-amber-500" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                    </button>
                  </div>
                  <div className={cn("mt-auto transition-opacity", localSettings.free_shipping_enabled ? "opacity-100" : "opacity-50 pointer-events-none")}>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الحد الأدنى للطلب للشحن المجاني</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={localSettings.free_shipping_threshold || ""}
                        onChange={(e) => setLocalSettings((s: any) => ({ ...s, free_shipping_threshold: Number(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none pr-12"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-2xl border border-amber-200/60 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg"><CreditCard className="w-5 h-5" /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">إعدادات الدفع وعربون الطباعة</h3>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">المركز العام للدفع</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      تم نقل إعدادات الدفع عند الاستلام (COD) ونظام العربون لمنتجات الطباعة الرقمية إلى <strong>تبويب الدفع</strong> لتوحيد المعاملات المالية وقواعد التحصيل.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("payment")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer w-fit"
                  >
                    <span>الانتقال لإعدادات الدفع والعربون</span>
                    <CreditCard className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Warehouse Address */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg"><Building className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">عنوان المستودع / المتجر الرئيسي</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">المحافظة</label>
                    <select 
                      value={localSettings.warehouse_governorate || "القاهرة"}
                      onChange={(e) => setLocalSettings((s: any) => ({ ...s, warehouse_governorate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold focus:bg-white outline-none cursor-pointer"
                    >
                      {zones?.map((z: any) => <option key={z.id} value={z.name}>{z.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">المدينة / المنطقة</label>
                    <input 
                      type="text" 
                      value={localSettings.warehouse_city || ""}
                      onChange={(e) => setLocalSettings((s: any) => ({ ...s, warehouse_city: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">العنوان بالتفصيل</label>
                    <input 
                      type="text" 
                      value={localSettings.warehouse_address || ""}
                      onChange={(e) => setLocalSettings((s: any) => ({ ...s, warehouse_address: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-medium outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (() => {
            // Simulator Calculations
            const simDepPercent = Number(localSettings.deposit_percentage ?? 30);
            const simMinDep = Number(localSettings.min_deposit_amount ?? 50);
            const simDepEnabled = localSettings.deposit_enabled ?? true;
            const simMode = localSettings.printing_payment_mode || "customer_choice";
            const simBasisType = localSettings.deposit_calculation_basis || "printing_only";
            const simCodActive = localSettings.cod_enabled ?? true;
            const simCodVal = simCodActive ? Number(localSettings.cod_fee ?? 15) : 0;

            const simSubtotal = Math.max(0, simPrintingTotal + simRetailTotal);
            const simNetItems = Math.max(0, simSubtotal - simCouponDiscount);
            const simGrand = simNetItems + simShippingCost + simCodVal;

            const simBasis = (simBasisType === "all_items") ? simNetItems : simPrintingTotal;
            const simRawDep = Math.round((simBasis * (simDepPercent / 100)) * 100) / 100;
            const simDepCandidate = Math.max(simRawDep, simMinDep);

            let simOnline = 0;
            let simRemaining = 0;

            if (!simDepEnabled || simPrintingTotal <= 0) {
              simOnline = simGrand;
              simRemaining = 0;
            } else if (simGrand <= simMinDep || simDepCandidate >= simGrand) {
              simOnline = simGrand;
              simRemaining = 0;
            } else {
              simOnline = simDepCandidate;
              simRemaining = Math.round((simGrand - simOnline) * 100) / 100;
            }

            return (
              <div className="space-y-6">
                {/* Unified Payment Command Center Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black">المركز العام لتحديد وإعدادات الدفع</h2>
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                          Single Source of Truth
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-1">
                        إدارة موحدة للدفع عند الاستلام، محرك العربون المالي الذكي لمنتجات الطباعة الرقمية، وبوابات الدفع الإلكتروني
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 1: Cash on Delivery (COD) Settings */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">الدفع عند الاستلام (Cash on Delivery - COD)</h3>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">تحصيل نقدي</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          تفعيل أو إيقاف خيار الدفع عند الاستلام وتحديد الرسوم الثابتة للخدمة
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setLocalSettings((s: any) => ({ ...s, cod_enabled: !s.cod_enabled }))}
                      className="cursor-pointer"
                    >
                      {localSettings.cod_enabled ? <ToggleRight className="w-10 h-10 text-emerald-600" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                    </button>
                  </div>

                  <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity", localSettings.cod_enabled ? "opacity-100" : "opacity-50 pointer-events-none")}>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        رسوم خدمة الدفع عند الاستلام الإضافية
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={localSettings.cod_fee ?? ""}
                          onChange={(e) => setLocalSettings((s: any) => ({ ...s, cod_fee: e.target.value === "" ? 0 : Number(e.target.value) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none pr-12"
                          placeholder="15"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ج.م</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">تضاف هذه القيمة تلقائياً لإجمالي الطلب عند اختيار العميل الدفع عند الاستلام.</p>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-900 leading-relaxed">
                        <strong className="font-bold block mb-1">القاعدة المالية الصارمة لمصاريف الـ COD:</strong>
                        تُضاف رسوم الدفع عند الاستلام بنسبة 100% بالكامل على المبلغ المتبقي ليحصلها مندوب شركة الشحن عند باب العميل، ولا يتم اقتطاع أو خصم أي مليم منها إلكترونياً عبر كاشير.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Custom Printing Deposit Engine */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                        <Printer className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">محرك العربون المالي لمنتجات الطباعة الرقمية (Print Deposit Engine)</h3>
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">حماية السيولة</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          تأمين مصاريف الشحن وتجهيز قوالب ومواد الطباعة المخصصة قبل البدء في الإنتاج
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setLocalSettings((s: any) => ({ ...s, deposit_enabled: !s.deposit_enabled }))}
                      className="cursor-pointer"
                    >
                      {localSettings.deposit_enabled ? <ToggleRight className="w-10 h-10 text-blue-600" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                    </button>
                  </div>

                  <div className={cn("space-y-6 transition-opacity", localSettings.deposit_enabled ? "opacity-100" : "opacity-50 pointer-events-none")}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Deposit Percentage */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Percent className="w-3.5 h-3.5 text-blue-600" />
                          <span>نسبة العربون المئوية</span>
                        </label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="10"
                            max="90"
                            value={localSettings.deposit_percentage ?? 30}
                            onChange={(e) => setLocalSettings((s: any) => ({ ...s, deposit_percentage: e.target.value === "" ? 0 : Number(e.target.value) }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none pr-10"
                            placeholder="30"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">القيمة الموصى بها هي 30% لتأمين الإنتاج.</p>
                      </div>

                      {/* Minimum Deposit Amount */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                          <span>الحد الأدنى للعربون (min_deposit_amount)</span>
                        </label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0"
                            value={localSettings.min_deposit_amount ?? 50}
                            onChange={(e) => setLocalSettings((s: any) => ({ ...s, min_deposit_amount: e.target.value === "" ? 0 : Number(e.target.value) }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none pr-12"
                            placeholder="50"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ج.م</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">يضمن تغطية الشحن الراجع وتكاليف الورق إذا كان الطلب رخيصاً أو عند استخدام كوبون كبير.</p>
                      </div>

                      {/* Printing Payment Mode */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-purple-600" />
                          <span>نمط الدفع لطلبات الطباعة</span>
                        </label>
                        <select
                          value={localSettings.printing_payment_mode || "customer_choice"}
                          onChange={(e) => setLocalSettings((s: any) => ({ ...s, printing_payment_mode: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                        >
                          <option value="customer_choice">تخيير العميل (عربون أو دفع كامل) - موصى به</option>
                          <option value="deposit_only">إلزامي دفع العربون فقط أونلاين</option>
                          <option value="full_only">إلزامي دفع كامل المبلغ أونلاين 100%</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">يحدد الخيارات المعروضة للزبون في صفحة إتمام الطلب.</p>
                      </div>

                      {/* Deposit Calculation Basis */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                          <span>أساس احتساب نسبة العربون</span>
                        </label>
                        <select
                          value={localSettings.deposit_calculation_basis || "printing_only"}
                          onChange={(e) => setLocalSettings((s: any) => ({ ...s, deposit_calculation_basis: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                        >
                          <option value="printing_only">قيمة منتجات الطباعة المخصصة فقط (موصى به)</option>
                          <option value="all_items">كامل سلة المشتريات (طباعة + منتجات جاهزة)</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">تطبيق النسبة على عناصر المطبوعات فقط أو إجمالي المنتجات بعد الخصم.</p>
                      </div>

                      {/* Allow Full COD for Printing Toggle */}
                      <div className="sm:col-span-2 lg:col-span-2 bg-rose-50/50 border border-rose-200/70 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-rose-950">السماح بالدفع عند الاستلام 100% لطلبات الطباعة</span>
                            <span className="text-[10px] bg-rose-200/80 text-rose-900 font-bold px-2 py-0.5 rounded-full">مخاطرة مالية</span>
                          </div>
                          <p className="text-[11px] text-rose-800/90 leading-relaxed max-w-xl">
                            <strong>تحذير مالي:</strong> في حال التفعيل، سيتمكن العميل من طلب مطبوعات مخصصة باسمه وتصميمه دون دفع أي عربون مسبق، مما يعرض المتجر لخسائر تكاليف الإنتاج والشحن إذا رفض الاستلام.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLocalSettings((s: any) => ({ ...s, allow_full_cod_for_printing: !s.allow_full_cod_for_printing }))}
                          className="cursor-pointer flex-shrink-0"
                        >
                          {localSettings.allow_full_cod_for_printing ? <ToggleRight className="w-10 h-10 text-rose-600" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                        </button>
                      </div>
                    </div>

                    {/* Interactive Live Simulator Widget */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-amber-600" />
                          <h4 className="text-sm font-bold text-slate-900">محاكي الحسابات اللحظي (Interactive Live Simulator)</h4>
                        </div>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          تجربة حية فورية
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">منتجات طباعة (ج.م):</label>
                          <input
                            type="number"
                            min="0"
                            value={simPrintingTotal}
                            onChange={(e) => setSimPrintingTotal(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">منتجات عادية (ج.م):</label>
                          <input
                            type="number"
                            min="0"
                            value={simRetailTotal}
                            onChange={(e) => setSimRetailTotal(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">مصاريف الشحن (ج.م):</label>
                          <input
                            type="number"
                            min="0"
                            value={simShippingCost}
                            onChange={(e) => setSimShippingCost(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">خصم الكوبون (ج.م):</label>
                          <input
                            type="number"
                            min="0"
                            value={simCouponDiscount}
                            onChange={(e) => setSimCouponDiscount(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Simulator Output Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">إجمالي الطلب الكلي (شامل الشحن والـ COD)</span>
                          <span className="text-base font-black text-slate-900">{simGrand.toFixed(2)} ج.م</span>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 shadow-xs">
                          <span className="text-[11px] text-emerald-800 font-semibold block mb-0.5">المطلوب سداده أونلاين الآن (العربون)</span>
                          <span className="text-base font-black text-emerald-700">{simOnline.toFixed(2)} ج.م</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 shadow-xs">
                          <span className="text-[11px] text-blue-800 font-semibold block mb-0.5">المتبقي للتحصيل عند الاستلام كـ COD</span>
                          <span className="text-base font-black text-blue-900">{simRemaining.toFixed(2)} ج.م</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Online Payment Gateways */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><CreditCard className="w-5 h-5" /></div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">بوابات الدفع الإلكتروني (Online Gateways)</h2>
                      <p className="text-sm text-slate-500 font-medium">قم بربط بوابات الدفع لتحصيل مبالغ العربون والدفع الكامل من عملائك بأمان</p>
                    </div>
                  </div>
                  <div>
                    {gateways?.map((gateway: any, index: number) => (
                      <div key={gateway.id} className={cn("p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors", index !== gateways.length - 1 && "border-b border-slate-100", gateway.is_active ? "bg-white" : "bg-slate-50/50")}>
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 font-bold text-sm">
                            {gateway.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900">{gateway.name}</h3>
                              {gateway.is_active && gateway.is_configured && (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" /> متصل</span>
                              )}
                              {gateway.is_active && !gateway.is_configured && (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><AlertCircle className="w-3 h-3" /> يحتاج إعداد</span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {gateway.type?.includes("cards") && <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md"><CreditCard className="w-3 h-3" /> البطاقات</span>}
                              {gateway.type?.includes("wallets") && <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md"><Shield className="w-3 h-3" /> المحافظ</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => openConfigModal(gateway, "payment")} className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">الإعدادات</button>
                          <button onClick={() => toggleGatewayMutation.mutate({ code: gateway.code, isActive: !gateway.is_active })}>
                            {gateway.is_active ? <ToggleRight className="w-10 h-10 text-amber-500" /> : <ToggleLeft className="w-10 h-10 text-slate-300 hover:text-slate-400" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Store & Contact Info */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">معلومات المتجر والتواصل</h2>
                    <p className="text-sm text-slate-500 font-medium">البيانات الأساسية للمتجر وقنوات التواصل الرسمية مع العملاء</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم المتجر</label>
                    <input
                      type="text"
                      value={localSettings.store_name || "Apex Store (Print Express)"}
                      onChange={(e) => setLocalSettings((s: any) => ({ ...s, store_name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold focus:bg-white outline-none"
                      placeholder="اسم المتجر"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      رقم الواتساب الرسمي (WhatsApp)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={localSettings.whatsapp_number || ""}
                        onChange={(e) => setLocalSettings((s: any) => ({ ...s, whatsapp_number: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-mono font-bold focus:bg-white outline-none text-left"
                        placeholder="01000000000"
                        dir="ltr"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      الرقم الذي يستقبل رسائل وطلبات العملاء عند النقر على أيقونة واتساب في المتجر.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">هاتف خدمة العملاء</label>
                    <input
                      type="text"
                      value={localSettings.store_phone || ""}
                      onChange={(e) => setLocalSettings((s: any) => ({ ...s, store_phone: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold focus:bg-white outline-none text-left"
                      placeholder="01000000000"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني للدعم</label>
                    <input
                      type="email"
                      value={localSettings.store_email || ""}
                      onChange={(e) => setLocalSettings((s: any) => ({ ...s, store_email: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-medium focus:bg-white outline-none text-left"
                      placeholder="support@apexstore.com"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 flex items-center justify-between gap-4 mt-4">
                  <div className="text-sm">
                    <p className="font-bold text-amber-900">هل ترغب في تخصيص نافذة الدردشة والرسالة الترحيبية؟</p>
                    <p className="text-xs text-amber-700 mt-0.5">يمكنك تخصيص الرسالة التلقائية للواتساب، الشات المباشر، والأسئلة الشائعة من مركز المحادثات.</p>
                  </div>
                  <a
                    href="/chat"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
                  >
                    الانتقال لمركز المحادثات
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "shipping" && activeTab !== "payment" && activeTab !== "general" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Settings className="w-8 h-8 text-slate-400" /></div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">جاري العمل على هذا القسم</h2>
              <p className="text-slate-500">سيتم تفعيل هذه الإعدادات قريباً.</p>
            </div>
          )}
        </div>
      </div>

      {/* Config Modal */}
      {configModalOpen && selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-700">{selectedEntity.name.charAt(0)}</div>
                <div>
                  <h3 className="font-bold text-slate-900">إعدادات {selectedEntity.name}</h3>
                  <p className="text-xs text-slate-500">الربط مع واجهة برمجة التطبيقات (API)</p>
                </div>
              </div>
              <button onClick={closeConfigModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit(onCredentialsSubmit)}>
              <div className="p-6 space-y-5">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex gap-3 text-sm font-medium">
                  <KeyRound className="w-5 h-5 text-blue-600 shrink-0" />
                  <p>قم بإدخال بيانات الربط لحسابك. سيتم تشفيرها وحفظها بأمان تام في قاعدة البيانات.</p>
                </div>

                {/* Dynamic Fields based on Entity Code */}
                {selectedEntity.code === "aramex" ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم (Username)</label>
                      <input {...register("username")} className={cn("w-full bg-white border rounded-xl py-2.5 px-4 outline-none", errors.username ? "border-red-500" : "border-slate-200")} />
                      {errors.username && <p className="text-red-500 text-xs mt-1 font-medium">{errors.username.message as string}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور (Password)</label>
                      <input type="password" {...register("password")} placeholder={selectedEntity.credentials?.password ? "تم الإعداد مسبقاً (مخفي)" : ""} className={cn("w-full bg-white border rounded-xl py-2.5 px-4 outline-none", errors.password ? "border-red-500" : "border-slate-200")} />
                      {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message as string}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">رقم الحساب</label>
                        <input {...register("account_number")} className={cn("w-full bg-white border rounded-xl py-2.5 px-4 outline-none", errors.account_number ? "border-red-500" : "border-slate-200")} />
                        {errors.account_number && <p className="text-red-500 text-xs mt-1 font-medium">{errors.account_number.message as string}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">رقم الـ PIN</label>
                        <input type="password" {...register("pin")} placeholder={selectedEntity.credentials?.pin ? "تم الإعداد مسبقاً (مخفي)" : ""} className={cn("w-full bg-white border rounded-xl py-2.5 px-4 outline-none", errors.pin ? "border-red-500" : "border-slate-200")} />
                        {errors.pin && <p className="text-red-500 text-xs mt-1 font-medium">{errors.pin.message as string}</p>}
                      </div>
                    </div>
                  </>
                ) : selectedEntity.code === "kashier" ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">معرف التاجر (Merchant ID)</label>
                      <input {...register("merchant_id")} className={cn("w-full bg-white border rounded-xl py-2.5 px-4 outline-none", errors.merchant_id ? "border-red-500" : "border-slate-200")} />
                      {errors.merchant_id && <p className="text-red-500 text-xs mt-1 font-medium">{errors.merchant_id.message as string}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">مفتاح الربط (API Key)</label>
                      <input type="password" {...register("api_key")} placeholder={selectedEntity.credentials?.api_key ? "تم الإعداد مسبقاً (مخفي) - اتركه فارغاً لعدم التغيير" : ""} className={cn("w-full bg-white border rounded-xl py-2.5 px-4 outline-none", errors.api_key ? "border-red-500" : "border-slate-200")} />
                      {errors.api_key && <p className="text-red-500 text-xs mt-1 font-medium">{errors.api_key.message as string}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">مفتاح التحديثات (Webhook Secret)</label>
                      <input type="password" {...register("webhook_secret")} placeholder={selectedEntity.credentials?.webhook_secret ? "تم الإعداد مسبقاً (مخفي) - اتركه فارغاً لعدم التغيير" : ""} className={cn("w-full bg-white border rounded-xl py-2.5 px-4 outline-none", errors.webhook_secret ? "border-red-500" : "border-slate-200")} />
                      {errors.webhook_secret && <p className="text-red-500 text-xs mt-1 font-medium">{errors.webhook_secret.message as string}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">بيئة العمل (Mode)</label>
                      <select {...register("mode")} className={cn("w-full bg-white border rounded-xl py-2.5 px-4 outline-none", errors.mode ? "border-red-500" : "border-slate-200")}>
                        <option value="test">بيئة الاختبار (Test Mode)</option>
                        <option value="live">بيئة التشغيل (Live Mode)</option>
                      </select>
                      {errors.mode && <p className="text-red-500 text-xs mt-1 font-medium">{errors.mode.message as string}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    {selectedEntity.code !== "bosta" && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">معرف التاجر (Merchant ID)</label>
                        <input {...register("merchant_id")} className={cn("w-full bg-white border rounded-xl py-2.5 px-4 outline-none", errors.merchant_id ? "border-red-500" : "border-slate-200")} />
                        {errors.merchant_id && <p className="text-red-500 text-xs mt-1 font-medium">{errors.merchant_id.message as string}</p>}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">مفتاح الربط (API Key / Secret)</label>
                      <input type="password" {...register("api_key")} placeholder={selectedEntity.credentials?.api_key ? "تم الإعداد مسبقاً (مخفي) - اتركه فارغاً لعدم التغيير" : ""} className={cn("w-full bg-white border rounded-xl py-2.5 px-4 outline-none", errors.api_key ? "border-red-500" : "border-slate-200")} />
                      {errors.api_key && <p className="text-red-500 text-xs mt-1 font-medium">{errors.api_key.message as string}</p>}
                    </div>
                  </>
                )}

                {/* Webhook Section */}
                {(() => {
                  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2080/api').replace(/\/$/, '');
                  const webhookUrl = configType === 'payment'
                    ? `${apiBase}/v1/payment/${selectedEntity.code}/webhook`
                    : `${apiBase}/v1/shipping/webhook/${selectedEntity.code}`;
                  return (
                    <div className="pt-4 border-t border-slate-100">
                      <label className="block text-sm font-bold text-slate-700 mb-2">رابط التحديثات التلقائية (Webhook URL)</label>
                      <div className="flex items-center gap-2">
                        <input type="text" readOnly value={webhookUrl} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-500 font-mono text-xs outline-none" dir="ltr" />
                        <button type="button" onClick={() => handleCopy(webhookUrl, 'webhook')} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl" title="نسخ الرابط">
                          {copiedId === 'webhook' ? <CheckCircle2 className="w-[18px] h-[18px] text-emerald-600" /> : <Save className="w-[18px] h-[18px]" />}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={closeConfigModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl">إلغاء</button>
                <button type="submit" disabled={updateCredentialsMutation.isPending} className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl flex items-center gap-2">
                  {updateCredentialsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ الربط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
