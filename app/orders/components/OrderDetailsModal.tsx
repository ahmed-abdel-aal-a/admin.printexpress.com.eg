import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MapPin, Phone, MessageCircle, Package, User, CheckCircle2, Download, 
  FileText, Printer, Edit3, Link as LinkIcon, Copy, Check, DollarSign, AlertTriangle, Loader2 
} from "lucide-react";
import { Order, OrderItemAddon } from "../types/order.types";
import { PaymentBadge } from "./PaymentBadge";
import { MOCK_STORE_SETTINGS } from "../constants/order.constants";
import { API_BASE_URL, getAuthToken } from "@/lib/api";
import toast from "react-hot-toast";

const ORDER_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending_price_confirmation: { label: "بانتظار تأكيد السعر", className: "bg-amber-50 text-amber-700 border-amber-200" },
  needs_action: { label: "تحتاج إجراء", className: "bg-rose-50 text-rose-700 border-rose-200" },
  pending: { label: "تحتاج إجراء", className: "bg-rose-50 text-rose-700 border-rose-200" },
  confirmed: { label: "تم التأكيد", className: "bg-blue-50 text-blue-700 border-blue-200" },
  processing: { label: "قيد التنفيذ", className: "bg-amber-50 text-amber-700 border-amber-200" },
  shipped: { label: "تم الشحن", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  completed: { label: "مكتمل", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  delivered: { label: "مكتمل", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "ملغي", className: "bg-slate-100 text-slate-700 border-slate-200" },
  refunded: { label: "مسترد", className: "bg-slate-100 text-slate-700 border-slate-200" },
  trash: { label: "المهملات", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export function OrderDetailsModal({ order, isOpen, onClose, onOrderUpdated }: OrderDetailsModalProps) {
  // Use local state to mock settings update, although we just read from mock constants
  const [manualConfirmation, setManualConfirmation] = useState(MOCK_STORE_SETTINGS.manualConfirmationRequired);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Volatile pricing & confirmation states
  const [currentOrder, setCurrentOrder] = useState<any>(order);
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [itemPriceInput, setItemPriceInput] = useState<string>("");
  const [itemNotesInput, setItemNotesInput] = useState<string>("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isIssuingToken, setIsIssuingToken] = useState(false);
  const [issuedPaymentUrl, setIssuedPaymentUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Manual payment states
  const [isManualConfirmOpen, setIsManualConfirmOpen] = useState(false);
  const [manualMethod, setManualMethod] = useState("instapay");
  const [manualRef, setManualRef] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setCurrentOrder(order);
    setIssuedPaymentUrl(null);
    setEditingItemId(null);
    setIsManualConfirmOpen(false);
  }, [order]);

  const getCategoryLabel = (category: string): string => {
    const map: Record<string, string> = {
      design: "ملف التصميم الأساسي",
      cover: "ملف الغلاف",
      inner_pages: "الصفحات الداخلية",
      spot_uv_mask: "ماسك Spot UV",
      foil_mask: "ماسك البصمة",
      cutting_guide: "دليل القص (Die-cut)",
    };
    if (map[category]) return map[category];
    if (category.startsWith("optional_")) return "مرفق إضافي اختياري";
    return category;
  };

  const getAddonName = (addon: OrderItemAddon): string => {
    let snapshot: any = addon.name_snapshot;
    if (typeof snapshot === "string") {
      try {
        snapshot = JSON.parse(snapshot);
      } catch {}
    }
    if (snapshot && typeof snapshot === "object") {
      return snapshot.ar || snapshot.en || Object.values(snapshot)[0] || "خدمة إضافية";
    }
    if (typeof snapshot === "string" && snapshot.trim()) {
      return snapshot;
    }

    let rawName: any = addon.name;
    if (typeof rawName === "string") {
      try {
        rawName = JSON.parse(rawName);
      } catch {}
    }
    if (rawName && typeof rawName === "object") {
      return rawName.ar || rawName.en || Object.values(rawName)[0] || "خدمة إضافية";
    }
    if (typeof rawName === "string" && rawName.trim()) {
      return rawName;
    }

    return "خدمة إضافية";
  };

  const handleDownloadFile = async (addonId: number | string, fileIndex: number) => {
    const key = `${addonId}-${fileIndex}`;
    try {
      setDownloadingKey(key);
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/v1/admin/orders/items/addons/${addonId}/files/${fileIndex}/download`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`فشل التحميل (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `addon-file-${fileIndex + 1}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      console.error("Download failed via blob, falling back to direct URL:", err);
      const token = getAuthToken();
      const directUrl = `${API_BASE_URL}/v1/admin/orders/items/addons/${addonId}/files/${fileIndex}/download?token=${encodeURIComponent(token)}`;
      window.open(directUrl, "_blank");
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDownloadPrintFile = async (orderId: string | number, itemId: string | number, category: string) => {
    const key = `print-${itemId}-${category}`;
    try {
      setDownloadingKey(key);
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/v1/admin/orders/items/${itemId}/files/${category}/download`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`فشل التحميل (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-${orderId}-item-${itemId}-${category}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      console.error("Download failed via blob, falling back to direct URL:", err);
      const token = getAuthToken();
      const directUrl = `${API_BASE_URL}/v1/admin/orders/items/${itemId}/files/${category}/download?token=${encodeURIComponent(token)}`;
      window.open(directUrl, "_blank");
    } finally {
      setDownloadingKey(null);
    }
  };

  if (!order) return null;

  const rawOrderId = (order as any).db_id || (currentOrder as any)?.db_id || currentOrder?.id || order.id;
  const effectiveStatus = currentOrder?.status || order.status;
  const statusConfig = ORDER_STATUS_MAP[effectiveStatus] || {
    label: effectiveStatus,
    className: "bg-slate-100 text-slate-700 border-slate-200"
  };

  const handleUpdateOrderStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/v1/admin/orders/${rawOrderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "فشل تحديث حالة الطلب");
      }
      toast.success("تم تحديث حالة الطلب بنجاح! 🚀");
      setCurrentOrder((prev: any) => ({ ...prev, status: newStatus }));
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تحديث حالة الطلب");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Format WhatsApp Number (Remove 0, add 20 for Egypt)
  const formatWhatsAppNumber = (phone: string) => {
    let cleaned = phone.replace(/[\s-]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "20" + cleaned.substring(1);
    } else if (cleaned.startsWith("+20")) {
      cleaned = cleaned.substring(1);
    } else if (!cleaned.startsWith("+") && !cleaned.startsWith("20")) {
      cleaned = "20" + cleaned;
    }
    return cleaned.replace("+", "");
  };

  const getWhatsAppLink = () => {
    const template = MOCK_STORE_SETTINGS.whatsappTemplate;
    const message = template
      .replace("{name}", currentOrder?.customerName || order.customerName)
      .replace("{order_id}", currentOrder?.order_number || currentOrder?.id || order.id)
      .replace("{total}", (currentOrder?.total || order.total).toString());
      
    const encodedMessage = encodeURIComponent(message);
    const formattedPhone = formatWhatsAppNumber(currentOrder?.customerPhone || order.customerPhone);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  };

  // 1. Save item price
  const handleSaveItemPrice = async (itemId: string | number) => {
    if (!itemPriceInput || isNaN(parseFloat(itemPriceInput))) {
      toast.error("يرجى إدخال مبلغ صحيح.");
      return;
    }
    setIsUpdatingPrice(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/v1/admin/orders/${rawOrderId}/items/${itemId}/confirm-price`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          confirmed_line_total: parseFloat(itemPriceInput),
          admin_notes: itemNotesInput || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "فشل تحديث سعر البند.");
      }

      toast.success(data.message || "تم اعتماد سعر البند بنجاح! 🎉");
      setCurrentOrder(data.order);
      setEditingItemId(null);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ السعر.");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // 2. Issue Price Confirmation Link
  const handleIssuePriceConfirmation = async () => {
    setIsIssuingToken(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/v1/admin/orders/${rawOrderId}/issue-price-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          hours_valid: 24,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "فشل توليد رابط الدفع.");
      }

      setIssuedPaymentUrl(data.payment_url);
      setCurrentOrder(data.order);
      toast.success("تم توليد رابط الدفع المباشر للعميل بنجاح! 🚀");
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء توليد الرابط.");
    } finally {
      setIsIssuingToken(false);
    }
  };

  // 3. Confirm Manual Payment (InstaPay / Vodafone Cash)
  const handleConfirmManualPayment = async () => {
    setIsSubmittingManual(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/v1/admin/orders/${rawOrderId}/confirm-manual-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          payment_method: manualMethod,
          transaction_reference: manualRef || null,
          admin_notes: manualNotes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "فشل تأكيد الدفع اليدوي.");
      }

      toast.success(data.message || "تم تأكيد الدفع اليدوي وإصدار بوليصة الشحن بنجاح! 💵");
      setCurrentOrder(data.order);
      setIsManualConfirmOpen(false);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تأكيد الدفع.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden rounded-3xl border-slate-100" style={{ direction: 'rtl' }}>
        <DialogHeader className="bg-slate-50/50 px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                طلب {order.id}
              </DialogTitle>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.className}`}>
                {statusConfig.label}
              </span>
            </div>
            <PaymentBadge status={order.paymentStatus} />
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">العميل</p>
                <p className="font-semibold text-slate-900">{order.customerName}</p>
                <p className="text-sm text-slate-500 mt-1" dir="ltr">{order.customerPhone}</p>
              </div>
            </div>

            <div className="flex gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">عنوان التوصيل</p>
                <p className="font-semibold text-sm text-slate-900 leading-relaxed">
                  {order.shippingAddress || "لم يتم توفير العنوان"}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Method & Carrier Details */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">طريقة الشحن:</span>
              {(order as any).shipping_method === 'express' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  ⚡ شحن سريع (توصيل فوري)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  📦 شحن عادي
                </span>
              )}
            </div>
            {((order as any).shipping_company || (order as any).shippingCompany) && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">الشركة المسندة:</span>
                <span className="font-bold text-slate-800 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  {(order as any).shipping_company || (order as any).shippingCompany}
                </span>
              </div>
            )}
            {(order as any).tracking_number && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">رقم البوليصة:</span>
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {(order as any).tracking_number}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm text-slate-800">المنتجات ({order.itemsCount})</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {(currentOrder?.items || order.items)?.map((item: any) => (
                <React.Fragment key={item.id}>
                <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-400">
                       صورة
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        الكمية: {item.item_type === 'printing' && item.printing_options?.physical_quantity ? item.printing_options.physical_quantity.toLocaleString() : item.quantity}
                        {item.item_type === 'printing' && item.quantity > 1 && (
                          <span className="text-amber-600 font-medium mr-1">({item.quantity} حزم)</span>
                        )}
                      </p>

                      {/* Printing Item Specifications & Files */}
                      {item.item_type === 'printing' && (
                        <div className="mt-2.5 bg-slate-50/90 p-3 rounded-xl border border-slate-200/70 text-xs space-y-2">
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
                            {(item.printing_options?.width_mm || item.printing_options?.length_mm) && (
                              <span><strong className="text-slate-900">الأبعاد:</strong> {item.printing_options?.width_mm || 0} مم × {item.printing_options?.length_mm || 0} مم</span>
                            )}
                            {item.printing_options?.image_count && item.printing_options.image_count > 1 && (
                              <span><strong className="text-slate-900">عدد الصفحات/الصور:</strong> {item.printing_options.image_count}</span>
                            )}
                          </div>

                          {item.printing_options?.notes && (
                            <div className="bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-200/50">
                              <strong>ملاحظات العميل:</strong> {item.printing_options.notes}
                            </div>
                          )}

                          {/* Print Design Files */}
                          {item.uploaded_files && Object.keys(item.uploaded_files).length > 0 && (
                            <div className="pt-2 border-t border-slate-200/60">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <Download className="w-3.5 h-3.5 text-blue-600" /> ملفات التصميم للطباعة:
                                </span>
                                {item.file_status && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.file_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                    item.file_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {item.file_status === 'approved' ? 'معتمد للطباعة' :
                                     item.file_status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(item.uploaded_files).map(([category, path]) => {
                                  if (!path || path === 'deleted_by_system') return null;
                                  const key = `print-${item.id}-${category}`;
                                  const isDownloading = downloadingKey === key;
                                  return (
                                    <button
                                      key={category}
                                      type="button"
                                      onClick={() => handleDownloadPrintFile(order.id, item.id, category)}
                                      disabled={isDownloading}
                                      className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 px-2.5 py-1.5 rounded-lg shadow-2xs font-medium cursor-pointer transition-colors disabled:opacity-50"
                                    >
                                      <Download className="w-3.5 h-3.5 text-blue-600" />
                                      {isDownloading ? "جاري التحميل..." : `تحميل ${getCategoryLabel(category)}`}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <div className="mt-2 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {item.addons.map((addon: OrderItemAddon, aIdx: number) => {
                            const addonName = getAddonName(addon);
                            const addonPrice = Number(addon.price_snapshot || addon.price_at_purchase || addon.price || 0);
                            return (
                              <div key={aIdx} className="text-xs text-slate-600 flex flex-col gap-0.5">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-slate-800">• {addonName}</span>
                                  <span className="text-amber-600 font-semibold">+{addonPrice.toFixed(2)} ج.م</span>
                                </div>
                                {addon.file_paths && addon.file_paths.length > 0 && (
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-[11px] text-emerald-600 font-medium">الملفات:</span>
                                    {addon.file_paths.map((fPath: string, fIdx: number) => {
                                      const key = `${addon.id}-${fIdx}`;
                                      const isDownloading = downloadingKey === key;
                                      return (
                                        <button
                                          key={fIdx}
                                          type="button"
                                          onClick={() => handleDownloadFile(addon.id, fIdx)}
                                          disabled={isDownloading}
                                          className="text-[11px] text-blue-600 underline hover:text-blue-800 font-medium disabled:opacity-50 cursor-pointer"
                                        >
                                          {isDownloading ? "جاري التحميل..." : `تحميل ملف ${fIdx + 1}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 text-left">
                    <div>
                      {Number((item as any).total ?? (item as any).price_at_purchase ?? item.price ?? 0).toLocaleString()} <span className="text-xs text-slate-500 font-medium">ج.م</span>
                    </div>
                    {item.item_type === 'printing' && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemId(editingItemId === item.id ? null : item.id);
                          setItemPriceInput(String((item as any).confirmed_line_total || item.total || (item as any).price_at_purchase || item.price || 0));
                          setItemNotesInput((item as any).admin_notes || "");
                        }}
                        className="mt-1 text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-normal underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> تعديل واعتماد السعر
                      </button>
                    )}
                  </div>
                </div>

                {editingItemId === item.id && (
                  <div className="p-3 bg-blue-50/70 border-t border-blue-100 space-y-2 text-xs">
                    <div className="font-bold text-blue-900 flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> اعتماد سعر بند الطباعة: {item.name}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-600 block mb-1">السعر الإجمالي المعتمد للبند (ج.م):</label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={itemPriceInput}
                          onChange={(e) => setItemPriceInput(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 block mb-1">ملاحظات للأدمن (اختياري):</label>
                        <Input 
                          type="text"
                          placeholder="مثال: زيادة خامات 300 جرام"
                          value={itemNotesInput}
                          onChange={(e) => setItemNotesInput(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingItemId(null)}
                        className="h-7 text-xs"
                      >
                        إلغاء
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveItemPrice(item.id)}
                        disabled={isUpdatingPrice || !itemPriceInput}
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isUpdatingPrice ? "جاري الحفظ..." : "حفظ واعتماد السعر"}
                      </Button>
                    </div>
                  </div>
                )}
              </React.Fragment>
              ))}
              {(!currentOrder?.items || currentOrder.items.length === 0) && (
                <div className="p-4 text-center text-slate-500 text-sm">
                  لا توجد منتجات مسجلة لهذا الطلب
                </div>
              )}
            </div>
            <div className="bg-slate-50/50 p-4 border-t border-slate-100 space-y-2 text-sm">
              {(currentOrder as any)?.shipping_cost !== undefined && (
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>تكلفة الشحن ({((currentOrder as any).shipping_method === 'express') ? 'سريع ⚡' : 'عادي 📦'}):</span>
                  <span className="font-semibold text-slate-700">{Number((currentOrder as any).shipping_cost).toLocaleString()} ج.م</span>
                </div>
              )}
              {(currentOrder as any)?.cod_fee && Number((currentOrder as any).cod_fee) > 0 ? (
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>رسوم الدفع عند الاستلام:</span>
                  <span className="font-semibold text-slate-700">{Number((currentOrder as any).cod_fee).toLocaleString()} ج.م</span>
                </div>
              ) : null}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                <span className="font-bold text-slate-800">الإجمالي النهائي</span>
                <span className="font-black text-lg text-emerald-600">
                  {Number(currentOrder?.total || order.total).toLocaleString()} <span className="text-xs font-medium">ج.م</span>
                </span>
              </div>

              {(currentOrder as any)?.payment_type === 'deposit' && (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 space-y-2 mt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-blue-900">نظام الدفع:</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">عربون + دفع عند الاستلام</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-blue-800 font-medium">العربون المطلوب/المدفوع أونلاين:</span>
                    <span className="font-bold text-emerald-700">{Number((currentOrder as any).deposit_amount ?? 0).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-blue-200/60">
                    <span className="text-blue-900 font-bold">المتبقي للتحصيل عند الاستلام (شامل الشحن والـ COD):</span>
                    <span className="font-black text-blue-950 text-sm">{Number((currentOrder as any).remaining_amount ?? 0).toLocaleString()} ج.م</span>
                  </div>
                </div>
              )}

              {/* Tokenized Payment Link & Manual Payment Actions */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleIssuePriceConfirmation}
                    disabled={isIssuingToken}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 gap-1.5 rounded-xl shadow-sm cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>{isIssuingToken ? "جاري التوليد..." : "🔗 إصدار وتوليد رابط الدفع (24 ساعة)"}</span>
                  </Button>

                  {currentOrder?.payment_status !== 'paid' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsManualConfirmOpen(!isManualConfirmOpen)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 rounded-xl shadow-sm cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>💵 تأكيد استلام تحويل يدوي (InstaPay / فودافون)</span>
                    </Button>
                  )}
                </div>

                {issuedPaymentUrl && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-amber-900">رابط الدفع المباشر للعميل:</p>
                    <div className="flex items-center gap-2">
                      <input 
                        readOnly 
                        value={issuedPaymentUrl} 
                        className="flex-1 bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-mono select-all"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(issuedPaymentUrl);
                          setCopiedLink(true);
                          toast.success("تم نسخ الرابط بنجاح!");
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="h-7 text-xs gap-1 border-amber-300 bg-white"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedLink ? "تم النسخ" : "نسخ"}
                      </Button>
                    </div>
                  </div>
                )}

                {isManualConfirmOpen && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-700" /> تأكيد استلام التحويل اليدوي وإصدار بوليصة الشحن:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-700 block mb-1">طريقة التحويل:</label>
                        <select
                          value={manualMethod}
                          onChange={(e) => setManualMethod(e.target.value)}
                          className="w-full h-8 text-xs border border-emerald-300 rounded-lg px-2 bg-white"
                        >
                          <option value="instapay">InstaPay (إنستاباي)</option>
                          <option value="vodafone_cash">Vodafone Cash (فودافون كاش)</option>
                          <option value="bank_transfer">تحويل بنكي مباشر</option>
                          <option value="manual">تحويل يدوي آخر</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-700 block mb-1">رقم المعاملة / المرجع (اختياري):</label>
                        <Input
                          type="text"
                          placeholder="مثال: TRX-998822"
                          value={manualRef}
                          onChange={(e) => setManualRef(e.target.value)}
                          className="h-8 text-xs bg-white border-emerald-300"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsManualConfirmOpen(false)}
                        className="h-7 text-xs"
                      >
                        إلغاء
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConfirmManualPayment}
                        disabled={isSubmittingManual}
                        className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        {isSubmittingManual ? "جاري التأكيد..." : "تأكيد الدفع فوراً"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Real Order Status Management Panel */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2">
                 <p className="text-sm font-bold text-slate-900">حالة الطلب ومسار التنفيذ:</p>
                 <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.className}`}>
                   {statusConfig.label}
                 </span>
               </div>
               <p className="text-xs text-slate-500">
                 يمكنك تغيير مسار وحالة الطلب مباشرة لتحديث لوحة التحكم وإشعار العميل.
               </p>
             </div>
             
             <div className="flex items-center gap-2 w-full sm:w-auto">
               <select 
                 value={['pending', 'needs_action'].includes(effectiveStatus) ? 'needs_action' : effectiveStatus}
                 onChange={(e) => handleUpdateOrderStatus(e.target.value)}
                 disabled={isUpdatingStatus}
                 aria-label="تغيير مسار الطلب"
                 className="h-10 text-xs font-bold rounded-xl border border-slate-300 bg-white px-3 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50 cursor-pointer"
               >
                 <option value="needs_action">تحتاج إجراء</option>
                 <option value="confirmed">تم التأكيد</option>
                 <option value="processing">قيد التنفيذ</option>
                 <option value="shipped">تم الشحن</option>
                 <option value="completed">مكتمل</option>
                 <option value="cancelled">ملغي</option>
               </select>
               {isUpdatingStatus && <Loader2 className="w-4 h-4 animate-spin text-slate-600" />}
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row gap-3">
          {['pending', 'needs_action'].includes(effectiveStatus) && (
            <Button 
              onClick={() => handleUpdateOrderStatus('confirmed')}
              disabled={isUpdatingStatus}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white gap-2 rounded-xl h-12 shadow-sm transition-transform active:scale-95"
            >
              {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              <span className="font-bold">تأكيد الطلب الآن</span>
            </Button>
          )}

          {effectiveStatus === 'confirmed' && (
            <Button 
              onClick={() => handleUpdateOrderStatus('processing')}
              disabled={isUpdatingStatus}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2 rounded-xl h-12 shadow-sm transition-transform active:scale-95"
            >
              {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-5 h-5" />}
              <span className="font-bold">بدء تنفيذ الطلب</span>
            </Button>
          )}

          {effectiveStatus === 'processing' && (
            <Button 
              onClick={() => handleUpdateOrderStatus('shipped')}
              disabled={isUpdatingStatus}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl h-12 shadow-sm transition-transform active:scale-95"
            >
              {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              <span className="font-bold">تم الشحن</span>
            </Button>
          )}

          <Button asChild className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white gap-2 rounded-xl h-12 shadow-sm transition-transform active:scale-95">
            <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5" />
              <span className="font-bold">تأكيد عبر الواتساب</span>
            </a>
          </Button>
          <Button asChild variant="outline" className="flex-1 bg-white hover:bg-slate-50 text-slate-700 gap-2 rounded-xl h-12 border-slate-200 transition-transform active:scale-95">
            <a href={`tel:${currentOrder?.customerPhone || order.customerPhone}`}>
              <Phone className="w-5 h-5" />
              <span className="font-bold">اتصال بالعميل</span>
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
