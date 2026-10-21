"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings2, Trash2, Tag, Palette, X, Loader2 } from "lucide-react";
import { Attribute } from "../types";

interface AttributesManagerProps {
  attributes: Attribute[];
  onAddAttribute: (name: string, initialValues: string[]) => void;
  onDeleteAttribute: (id: string) => void;
  onAddValueToAttribute: (attrId: string, value: string) => void;
  onRemoveValueFromAttribute: (attrId: string, value: string) => void;
  isAdding?: boolean;
  isUpdating?: boolean;
}

export default function AttributesManager({
  attributes,
  onAddAttribute,
  onDeleteAttribute,
  onAddValueToAttribute,
  onRemoveValueFromAttribute,
  isAdding = false,
  isUpdating = false,
}: AttributesManagerProps) {
  const [newAttrName, setNewAttrName] = useState("");
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>(
    {},
  );
  const [newValueColors, setNewValueColors] = useState<Record<string, string>>(
    {},
  );

  const handleAddAttribute = () => {
    if (newAttrName.trim()) {
      onAddAttribute(newAttrName.trim(), []);
      setNewAttrName("");
    }
  };

  const handleAddValue = (attrId: string, isColor: boolean = false) => {
    const valName = newValueInputs[attrId];
    if (valName && valName.trim()) {
      const finalVal = isColor
        ? `${valName.trim()}|${newValueColors[attrId] || "#000000"}`
        : valName.trim();
      onAddValueToAttribute(attrId, finalVal);
      setNewValueInputs((prev) => ({ ...prev, [attrId]: "" }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Add New Attribute */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-end gap-4">
        <div className="space-y-2 flex-1 w-full">
          <Label>اسم المتغير الجديد (مثال: المقاس، الوزن، الخامة...)</Label>
          <Input
            placeholder="أدخل اسم المتغير..."
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddAttribute()}
          />
        </div>
        <Button
          onClick={handleAddAttribute}
          disabled={!newAttrName.trim() || isAdding}
          className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-10 shrink-0 w-full md:w-auto"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          إضافة المتغير
        </Button>
      </div>

      {/* Attributes List */}
      <div className="space-y-6">
        {attributes.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-slate-100 text-slate-500 font-medium">
            لا توجد متغيرات حالياً. المتغير الأساسي &quot;اللون&quot; يجب أن
            يكون موجوداً.
          </div>
        ) : (
          attributes.map((attr) => (
            <div
              key={attr.id}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${attr.name === "اللون" ? "bg-pink-100 text-pink-600" : "bg-emerald-100 text-emerald-600"}`}
                  >
                    {attr.name === "اللون" ? (
                      <Palette className="w-5 h-5" />
                    ) : (
                      <Settings2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">
                      {attr.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {attr.values.length} قيم مسجلة
                    </p>
                  </div>
                </div>
                {attr.name !== "اللون" && (
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDeleteAttribute(attr.id)}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف المتغير
                  </Button>
                )}
              </div>

              {/* Values */}
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-6">
                  {attr.values.length === 0 ? (
                    <span className="text-sm text-slate-400 italic">
                      لا توجد قيم بعد. أضف بعض القيم...
                    </span>
                  ) : (
                    attr.values.map((val) => {
                      const isColorAttr = attr.name === "اللون";
                      const [colorName, colorHex] = isColorAttr && val.includes("|") 
                        ? val.split("|") 
                        : [val, getCSSColor(val)];
                        
                      return (
                      <div
                        key={val}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium transition-colors group border border-slate-200"
                      >
                        {isColorAttr && (
                          <div
                            className="w-3 h-3 rounded-full bg-slate-300"
                            style={{ backgroundColor: colorHex }}
                          />
                        )}
                        <span>{colorName}</span>
                        <button
                          onClick={() =>
                            onRemoveValueFromAttribute(attr.id, val)
                          }
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all mr-1"
                          title="حذف"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )})
                  )}
                </div>

                {/* Add Value Input */}
                <div className="flex items-center gap-2 max-w-sm">
                  <div className="relative flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder={`أضف قيمة جديدة (مثل: ${attr.name === "اللون" ? "أزرق" : "كبير"})...`}
                        className="pr-9"
                        value={newValueInputs[attr.id] || ""}
                        onChange={(e) =>
                          setNewValueInputs((prev) => ({
                            ...prev,
                            [attr.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddValue(attr.id, attr.name === "اللون")
                        }
                      />
                    </div>
                    {attr.name === "اللون" && (
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 cursor-pointer"
                        value={newValueColors[attr.id] || "#000000"}
                        onChange={(e) =>
                          setNewValueColors((prev) => ({
                            ...prev,
                            [attr.id]: e.target.value,
                          }))
                        }
                        title="اختر لون"
                      />
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddValue(attr.id, attr.name === "اللون")}
                    disabled={!newValueInputs[attr.id]?.trim() || isUpdating}
                    className="bg-slate-800 hover:bg-slate-900 min-w-16"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "إضافة"}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Very basic heuristic to show colors in UI for some common arabic color names
function getCSSColor(name: string) {
  const map: Record<string, string> = {
    أحمر: "#ef4444",
    أزرق: "#3b82f6",
    أخضر: "#22c55e",
    أصفر: "#eab308",
    أسود: "#000000",
    أبيض: "#ffffff",
    رمادي: "#64748b",
    برتقالي: "#f97316",
    بنفسجي: "#a855f7",
    وردي: "#ec4899",
    بني: "#78350f",
  };
  return map[name] || "#cbd5e1";
}
