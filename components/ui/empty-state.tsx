import React from "react";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ searchQuery, onClearSearch }: { searchQuery: string; onClearSearch?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
        <PackageSearch className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد طلبات</h3>
      <p className="text-sm text-slate-500 max-w-sm">
        {searchQuery
          ? `لم نتمكن من العثور على نتائج مطابقة لـ "${searchQuery}"`
          : "لا توجد طلبات في هذه الحالة حالياً. الطلبات الجديدة ستظهر هنا تلقائياً."}
      </p>
      {searchQuery && (
        <Button
          variant="outline"
          className="mt-6 rounded-xl"
          onClick={onClearSearch}
        >
          مسح البحث
        </Button>
      )}
    </div>
  );
}
