import React from "react";
import { cn } from "@/lib/utils";
import { PaymentStatus } from "../types/order.types";

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const configs: Record<string, { label: string; className: string }> = {
    paid: {
      label: "مدفوع بالكامل",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    partially_paid: {
      label: "عربون مدفوع",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    unpaid: {
      label: "غير مدفوع",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    },
    cod: {
      label: "الدفع عند الاستلام",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    refunded: {
      label: "مسترد",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    flagged_fraud: {
      label: "مشبوه / قيد المراجعة",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },
    failed: {
      label: "فشل الدفع",
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const config = configs[status] || {
    label: status,
    className: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-md text-[10px] font-bold border",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
