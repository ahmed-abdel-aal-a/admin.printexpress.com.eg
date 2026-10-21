import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  type: "neutral" | "warning" | "info" | "success";
}

export function StatCard({ title, value, trend, type }: StatCardProps) {
  const styles = {
    neutral: "bg-white border-slate-200",
    warning: "bg-gradient-to-br from-rose-50 to-orange-50 border-orange-100",
    info: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100",
    success: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100",
  };

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border shadow-sm flex flex-col justify-between",
        styles[type],
      )}
    >
      <p className="text-slate-500 text-xs font-medium mb-2">{title}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-black text-slate-900">{value}</p>
        {trend && (
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-1 rounded-full",
              trend.startsWith("+")
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700",
            )}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
