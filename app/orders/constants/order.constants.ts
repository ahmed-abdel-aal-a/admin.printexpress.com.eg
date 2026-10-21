import { Order, OrderStatus } from "../types/order.types";

export const MOCK_STORE_SETTINGS = {
  manualConfirmationRequired: true,
  whatsappTemplate: "مرحباً {name}، تم استلام طلبك رقم {order_id} بنجاح وقيمته {total} ج.م. جاري تجهيزه حالياً.",
};

// MOCK_ORDERS removed for real API integration

export const STATUS_TABS: {
  id: OrderStatus;
  label: string;
  iconName: string;
  color: string;
}[] = [
  {
    id: "pending_price_confirmation",
    label: "بانتظار تأكيد السعر",
    iconName: "Clock",
    color: "text-amber-600 bg-amber-50 border-amber-300",
  },
  {
    id: "needs_action",
    label: "تحتاج إجراء",
    iconName: "AlertCircle",
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    id: "confirmed",
    label: "تم التأكيد",
    iconName: "CheckCircle2",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    id: "processing",
    label: "قيد التنفيذ",
    iconName: "RefreshCcw",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    id: "shipped",
    label: "مشحونة",
    iconName: "Truck",
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  {
    id: "completed",
    label: "مكتملة",
    iconName: "Box",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    id: "cancelled",
    label: "ملغية/مسترد",
    iconName: "Ban",
    color: "text-slate-600 bg-slate-50 border-slate-200",
  },
  {
    id: "trash",
    label: "المهملات",
    iconName: "Trash2",
    color: "text-slate-400 bg-slate-50 border-slate-200",
  },
];
