"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, FolderTree, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Category } from "../types";
import { useQuery } from "@tanstack/react-query";
import { addonsApi } from "@/lib/services/addons";
import { Checkbox } from "@/components/ui/checkbox";

interface CategoriesManagerProps {
  categories: Category[];
  onSaveCategory: (data: { name: string; parent_id: string | null; addon_group_ids?: number[] }, id?: string) => void;
  onDeleteCategory: (id: string) => void;
  onBulkDeleteCategories: (ids: string[]) => void;
  isSubmitting?: boolean;
  isBulkDeleting?: boolean;
}

export default function CategoriesManager({
  categories,
  onSaveCategory,
  onDeleteCategory,
  onBulkDeleteCategories,
  isSubmitting = false,
  isBulkDeleting = false,
}: CategoriesManagerProps) {
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formParentId, setFormParentId] = useState<string>("none");
  const [formAddonGroupIds, setFormAddonGroupIds] = useState<number[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
      setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
              next.delete(id);
          } else {
              next.add(id);
          }
          return next;
      });
  };

  const selectAll = () => {
      setSelectedIds(new Set(categories.map(c => c.id)));
  };

  const clearSelection = () => {
      setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
      if (selectedIds.size === 0) return;
      onBulkDeleteCategories(Array.from(selectedIds));
      clearSelection();
  };

  const { data: addonGroups = [] } = useQuery({
    queryKey: ["addonGroups"],
    queryFn: addonsApi.getAddonGroups,
    enabled: isModalOpen,
  });

  useEffect(() => {
    if (isModalOpen) {
      if (editingCategory) {
        setFormName(editingCategory.name);
        setFormParentId(editingCategory.parentId || "none");
        setFormAddonGroupIds(editingCategory.addonGroupIds || []);
      } else {
        setFormName("");
        setFormParentId("none");
        setFormAddonGroupIds([]);
      }
    }
  }, [isModalOpen, editingCategory]);

  const handleSave = () => {
    if (formName.trim()) {
      onSaveCategory(
        {
          name: formName.trim(),
          parent_id: formParentId === "none" ? null : formParentId,
          addon_group_ids: formAddonGroupIds,
        },
        editingCategory ? editingCategory.id : undefined
      );
      // Wait for success in parent to close? For simplicity we close optimistic or let parent handle, 
      // but standard is closing here and let parent invalidate
      setIsModalOpen(false);
    }
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      const children = getChildren(categoryToDelete);
      if (children.length > 0) {
        alert("لا يمكنك حذف هذا التصنيف لأنه يحتوي على تصنيفات فرعية. يرجى حذف أو نقل التصنيفات الفرعية أولاً.");
        setCategoryToDelete(null);
        return;
      }
      onDeleteCategory(categoryToDelete);
      setCategoryToDelete(null);
    }
  };

  // Helper to get children
  const getChildren = (parentId: string | null) =>
    categories.filter((c) => c.parentId === parentId);

  const toggleAddonGroup = (id: number) => {
    setFormAddonGroupIds(prev => 
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    );
  };

  const renderCategoryTree = (parentId: string | null = null, depth = 0) => {
    const children = getChildren(parentId);
    if (children.length === 0) return null;

    return (
      <ul className="space-y-2">
        {children.map((category) => (
          <li key={category.id} className="relative">
            <div
              className={`flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group ${depth > 0 ? "mt-2" : ""}`}
              style={{ marginRight: depth > 0 ? `${depth * 1.5}rem` : "0" }}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.has(category.id)}
                  onCheckedChange={() => toggleSelect(category.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                />
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-medium text-slate-800 block">
                    {category.name}
                  </span>
                  {(category.addonGroupIds?.length || 0) > 0 && (
                     <span className="text-xs text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                       مربوط بخدمات إضافية
                     </span>
                  )}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => { setEditingCategory(category); setIsModalOpen(true); }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setCategoryToDelete(category.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {renderCategoryTree(category.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-indigo-500" />
          هيكلة التصنيفات
        </h3>
        <Button
          onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-10"
        >
          <Plus className="w-4 h-4" /> إضافة تصنيف
        </Button>
      </div>

      {/* Category Tree */}
      {selectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-red-50 border border-red-100 p-3 rounded-2xl mb-4">
              <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-red-700">
                      تم تحديد {selectedIds.size} تصنيف
                  </span>
                  <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-600 hover:text-slate-800"
                      onClick={selectAll}
                  >
                      تحديد الكل
                  </Button>
                  <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-600 hover:text-slate-800"
                      onClick={clearSelection}
                  >
                      إلغاء التحديد
                  </Button>
              </div>
              <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="gap-2"
              >
                  {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  حذف المحدد ({selectedIds.size})
              </Button>
          </div>
      )}
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
        {categories.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-medium">
            لا يوجد تصنيفات حالياً. أضف تصنيفاً جديداً للبدء.
          </div>
        ) : (
          renderCategoryTree(null, 0)
        )}
      </div>

      {/* Category Modal (Add / Edit) */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "تعديل تصنيف" : "إضافة تصنيف جديد"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم التصنيف *</Label>
                <Input
                  placeholder="مثال: مطبوعات ورقية"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>يتبع لتصنيف (الأب)</Label>
                <Select
                  dir="rtl"
                  value={formParentId}
                  onValueChange={setFormParentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="التصنيف الأساسي" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- تصنيف رئيسي --</SelectItem>
                    {categories.filter(c => c.id !== editingCategory?.id).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Label className="text-base font-bold text-slate-800 mb-2 block">مجموعات الخدمات الإضافية</Label>
              <p className="text-sm text-slate-500 mb-4">اختر الخدمات التي ترغب بإتاحتها لجميع المنتجات تحت هذا التصنيف.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addonGroups.length === 0 ? (
                  <p className="text-sm text-slate-400">لا توجد مجموعات خدمات للربط.</p>
                ) : addonGroups.map((group) => {
                  const groupIdNum = typeof group.id === 'string' ? parseInt(group.id, 10) : group.id;
                  const isSelected = formAddonGroupIds.includes(groupIdNum);
                  
                  return (
                    <div 
                      key={group.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'}`}
                      onClick={() => toggleAddonGroup(groupIdNum)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleAddonGroup(groupIdNum)}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                      <span className="font-medium text-slate-700 text-sm">{group.name?.ar}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700" 
              onClick={handleSave}
              disabled={!formName.trim() || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "حفظ التصنيف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-red-600 text-right flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              تأكيد الحذف
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-right">
            <p className="text-slate-600 font-medium">
              هل أنت متأكد من حذف هذا التصنيف؟
              <br />
              <span className="text-red-500 font-bold mt-2 inline-block">
                تنبيه: لا يمكن التراجع عن هذا الإجراء.
              </span>
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-row justify-end">
            <Button
              variant="outline"
              onClick={() => setCategoryToDelete(null)}
            >
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              نعم، قم بالحذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
