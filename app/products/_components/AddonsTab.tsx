"use client";

import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { ProductFormValues } from "../schema";
import { addonsApi } from "@/lib/services/addons";
import { Label } from "@/components/ui/label";
import { Loader2, Layers } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AddonsTabProps {
  form: UseFormReturn<ProductFormValues>;
}

export function AddonsTab({ form }: AddonsTabProps) {
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["addonGroups"],
    queryFn: addonsApi.getAddonGroups,
  });

  const selectedGroupIds = form.watch("addonGroupIds") || [];

  const handleToggle = (id: number) => {
    const isSelected = selectedGroupIds.includes(id);
    if (isSelected) {
      form.setValue(
        "addonGroupIds",
        selectedGroupIds.filter((groupId) => groupId !== id)
      );
    } else {
      form.setValue("addonGroupIds", [...selectedGroupIds, id]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            مجموعات الخدمات الإضافية
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            اختر مجموعات الخدمات التي تود إتاحتها مع هذا المنتج (مثل: التغليف، الكروت، إضافات الطباعة).
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-500 font-medium">لا توجد مجموعات خدمات متاحة حالياً.</p>
            <p className="text-sm text-slate-400 mt-1">قم بإضافة المجموعات من قسم "الخدمات الإضافية".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => {
              // Convert group id to number if it isn't already to match our schema
              const groupIdNum = typeof group.id === 'string' ? parseInt(group.id, 10) : group.id;
              const isSelected = selectedGroupIds.includes(groupIdNum);

              return (
                <div
                  key={group.id}
                  className={`flex flex-col p-4 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
                  onClick={() => handleToggle(groupIdNum)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Label className="font-bold text-slate-800 cursor-pointer text-base">
                        {group.name?.ar}
                      </Label>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {group.description?.ar || "لا يوجد وصف"}
                      </p>
                    </div>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(groupIdNum)}
                      className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 mt-1"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-white rounded-md text-[10px] font-bold text-slate-500 border border-slate-100">
                      {group.input_type === "checkbox" ? "متعدد" : "مفرد"}
                    </span>
                    <span className="px-2 py-1 bg-white rounded-md text-[10px] font-bold text-slate-500 border border-slate-100">
                      {group.is_required ? "إجباري" : "اختياري"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
