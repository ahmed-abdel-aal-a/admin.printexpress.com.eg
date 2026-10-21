"use client";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { ProductFormValues } from "../schema";
import { Attribute } from "../types";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tag, Trash2, Coins, ChevronDown, ImageIcon, Sparkles } from "lucide-react";

export function VariantsTab({ form, attributes }: { form: UseFormReturn<ProductFormValues>; attributes: Attribute[] }) {
  const { control, watch, setValue } = form;
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "variants",
  });
  const [selectedAttributes, setSelectedAttributes] = useState<{ attrId: string; values: string[] }[]>([]);
  const [bulkBasePrice, setBulkBasePrice] = useState("");
  const [bulkDiscountPrice, setBulkDiscountPrice] = useState("");

  const handleSelectAttribute = (attrId: string) => {
    if (!selectedAttributes.find((a) => a.attrId === attrId)) {
      setSelectedAttributes([...selectedAttributes, { attrId, values: [] }]);
    }
  };

  const handleSelectValue = (attrId: string, value: string) => {
    setSelectedAttributes((prev) =>
      prev.map((a) => {
        if (a.attrId === attrId) {
          if (a.values.includes(value)) {
            return { ...a, values: a.values.filter((v) => v !== value) };
          }
          return { ...a, values: [...a.values, value] };
        }
        return a;
      })
    );
  };

  const generateVariants = () => {
    const validSelections = selectedAttributes.filter((a) => a.values.length > 0);
    if (validSelections.length === 0) return;

    // Calculate total expected combinations
    let totalCombinations = 1;
    validSelections.forEach(selection => {
      totalCombinations *= selection.values.length;
    });

    if (totalCombinations > 100) {
      alert(`لا يمكن توليد أكثر من 100 متغير لحماية النظام (الحالي: ${totalCombinations}). يرجى تقليل الخيارات.`);
      return;
    }

    let combinations: { attrs: { name: string; value: string }[]; values: string[] }[] = [
      { attrs: [], values: [] },
    ];

    validSelections.forEach((selection) => {
      const attr = attributes.find((a) => a.id === selection.attrId);
      if (!attr) return;
      const newCombinations: typeof combinations = [];
      combinations.forEach((comb) => {
        selection.values.forEach((val) => {
          newCombinations.push({
            attrs: [...comb.attrs, { name: attr.name, value: val }],
            values: [...comb.values, val],
          });
        });
      });
      combinations = newCombinations;
    });

    const currentVariants = form.getValues("variants") || [];
    const newVariants = combinations.map((comb) => {
      const name = comb.values.join(" - ");
      const existing = currentVariants.find((v) => v.name === name);
      return {
        id: existing ? existing.id : crypto.randomUUID(),
        name,
        attributes: comb.attrs,
        price: Number(existing ? existing.price : bulkBasePrice) || 0,
        discountPrice: existing?.discountPrice ? Number(existing.discountPrice) : (bulkDiscountPrice ? Number(bulkDiscountPrice) : undefined),
        quantity: existing?.quantity ? Number(existing.quantity) : undefined,
        sku: existing ? existing.sku : "",
        trackInventory: existing ? existing.trackInventory : true,
      };
    });

    setValue("variants", newVariants);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">إنشاء متغيرات المنتج</h3>
        <div className="flex gap-2 mb-6">
          <Select dir="rtl" onValueChange={handleSelectAttribute}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="إضافة متغير جديد..." />
            </SelectTrigger>
            <SelectContent>
              {attributes
                .filter((a) => !selectedAttributes.find((sa) => sa.attrId === a.id))
                .map((attr) => (
                  <SelectItem key={attr.id} value={attr.id}>{attr.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-4 mb-6">
          {selectedAttributes.map((sa) => {
            const attr = attributes.find((a) => a.id === sa.attrId);
            if (!attr) return null;
            return (
              <div key={sa.attrId} className="bg-white p-4 rounded-xl border border-slate-100 flex gap-4 items-start">
                <div className="w-32 font-bold text-slate-700 pt-2">{attr.name}:</div>
                <div className="flex-1 flex flex-wrap gap-2">
                  {attr.values.map((val) => {
                    const isSelected = sa.values.includes(val);
                    const isColorAttr = attr.name === "اللون";
                    const [colorName, colorHex] = isColorAttr && val.includes("|") ? val.split("|") : [val, "#cbd5e1"];
                    return (
                      <button
                        key={val}
                        onClick={() => handleSelectValue(sa.attrId, val)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 border ${
                          isSelected ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {isColorAttr && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorHex }} />}
                        {colorName}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setSelectedAttributes(selectedAttributes.filter((s) => s.attrId !== sa.attrId))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4">
          <Button onClick={generateVariants} disabled={selectedAttributes.length === 0} className="bg-slate-800 hover:bg-slate-900 gap-2">
            <Sparkles className="w-4 h-4" /> توليد المتغيرات
          </Button>
        </div>
      </div>
      
      {fields.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-bold text-slate-800 text-lg">قائمة المتغيرات ({fields.length})</h4>
          {fields.map((variant, index) => (
            <div key={variant.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">{variant.name || "متغير"}</h5>
                  <div className="text-xs text-slate-500 flex gap-2 mt-1">
                    {variant.attributes?.map((a, i) => (
                      <span key={i} className="bg-slate-100 px-2 py-0.5 rounded">{a.value.split("|")[0]}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                <div className="w-24">
                  <Label className="text-xs mb-1 block text-slate-500">السعر</Label>
                  <Input {...form.register(`variants.${index}.price` as const)} className="h-9 text-xs" />
                </div>
                <div className="w-24">
                  <Label className="text-xs mb-1 block text-slate-500">التخفيض</Label>
                  <Input {...form.register(`variants.${index}.discountPrice` as const)} className="h-9 text-xs" />
                </div>
                <div className="w-24">
                  <Label className="text-xs mb-1 block text-slate-500">SKU</Label>
                  <Input {...form.register(`variants.${index}.sku` as const)} className="h-9 text-xs" />
                </div>
                <div className="w-20">
                  <Label className="text-xs mb-1 block text-slate-500">الكمية</Label>
                  <Input {...form.register(`variants.${index}.quantity` as const)} className="h-9 text-xs" />
                </div>
                <Button variant="ghost" className="text-red-500 hover:bg-red-50 p-2 h-9 mt-5" onClick={() => remove(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
