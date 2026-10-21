"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addonsApi } from "@/lib/services/addons";
import { AddonGroup, ProductAddon } from "./types";
import { AddonGroupFormValues, ProductAddonFormValues } from "./schema";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Plus, Loader2, Edit2, Trash2, Layers, CheckCircle2, XCircle } from "lucide-react";
import AddonGroupFormModal from "./_components/AddonGroupFormModal";
import ProductAddonFormModal from "./_components/ProductAddonFormModal";

export default function AddonsManagementPage() {
  const queryClient = useQueryClient();

  const [selectedGroup, setSelectedGroup] = useState<AddonGroup | null>(null);
  
  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AddonGroup | null>(null);
  
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ProductAddon | null>(null);

  // Queries
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ["addonGroups"],
    queryFn: addonsApi.getAddonGroups,
  });

  const { data: addons = [], isLoading: isLoadingAddons } = useQuery({
    queryKey: ["productAddons", selectedGroup?.id],
    queryFn: () => addonsApi.getProductAddons(selectedGroup!.id),
    enabled: !!selectedGroup,
  });

  // Group Mutations
  const createGroupMutation = useMutation({
    mutationFn: (data: AddonGroupFormValues) => addonsApi.createAddonGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addonGroups"] });
      toast.success("تم إضافة مجموعة الخدمات بنجاح");
      setIsGroupModalOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء الإضافة"),
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddonGroupFormValues }) => addonsApi.updateAddonGroup(id, data),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: ["addonGroups"] });
      if (selectedGroup?.id?.toString() === updatedGroup.id?.toString()) setSelectedGroup(updatedGroup);
      toast.success("تم التحديث بنجاح");
      setIsGroupModalOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => addonsApi.deleteAddonGroup(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["addonGroups"] });
      if (selectedGroup?.id?.toString() === deletedId?.toString()) setSelectedGroup(null);
      toast.success("تم الحذف بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  // Addon Mutations
  const createAddonMutation = useMutation({
    mutationFn: (data: ProductAddonFormValues) => addonsApi.createProductAddon(selectedGroup!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productAddons", selectedGroup?.id] });
      toast.success("تم إضافة الخدمة بنجاح");
      setIsAddonModalOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء الإضافة"),
  });

  const updateAddonMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductAddonFormValues }) => addonsApi.updateProductAddon(selectedGroup!.id, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productAddons", selectedGroup?.id] });
      toast.success("تم التحديث بنجاح");
      setIsAddonModalOpen(false);
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });

  const deleteAddonMutation = useMutation({
    mutationFn: (id: string) => addonsApi.deleteProductAddon(selectedGroup!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productAddons", selectedGroup?.id] });
      toast.success("تم الحذف بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  // Handlers
  const handleGroupSubmit = (data: AddonGroupFormValues) => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data });
    } else {
      createGroupMutation.mutate(data);
    }
  };

  const handleAddonSubmit = (data: ProductAddonFormValues) => {
    if (editingAddon) {
      updateAddonMutation.mutate({ id: editingAddon.id, data });
    } else {
      createAddonMutation.mutate(data);
    }
  };

  const confirmDeleteGroup = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المجموعة بالكامل بجميع خدماتها؟")) {
      deleteGroupMutation.mutate(id);
    }
  };

  const confirmDeleteAddon = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الخدمة؟")) {
      deleteAddonMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">إدارة الخدمات الإضافية</h1>
          <p className="text-slate-500 mt-1 text-sm">أنشئ مجموعات لخيارات الإضافة (مثل التغليف، الهدايا) واربطها بالمنتجات.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Groups Column */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-700">مجموعات الخدمات</h2>
            <Button 
              size="sm" 
              onClick={() => { setEditingGroup(null); setIsGroupModalOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 h-9"
            >
              <Plus className="w-4 h-4 mr-1" /> مجموعة جديدة
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-[400px]">
            {isLoadingGroups ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
            ) : groups.length === 0 ? (
              <div className="p-8 text-center text-slate-500">لا توجد مجموعات خدمات حتى الآن.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {groups.map((group) => (
                  <div 
                    key={group.id} 
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${selectedGroup?.id === group.id ? 'bg-indigo-50/80 border-r-4 border-indigo-600' : 'hover:bg-slate-50 border-r-4 border-transparent'}`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div>
                      <h3 className="font-bold text-slate-800">{group.name?.ar}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {group.input_type === 'checkbox' ? 'متعدد الاختيار' : 'اختيار واحد'} • {group.is_required ? 'إجباري' : 'اختياري'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setIsGroupModalOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); confirmDeleteGroup(group.id.toString()); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Addons Column */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-700">
              الخدمات التابعة: {selectedGroup ? <span className="text-indigo-600">{selectedGroup.name?.ar}</span> : <span className="text-slate-400 font-normal">اختر مجموعة</span>}
            </h2>
            {selectedGroup && (
              <Button 
                size="sm" 
                onClick={() => { setEditingAddon(null); setIsAddonModalOpen(true); }}
                className="bg-indigo-600 hover:bg-indigo-700 h-9"
              >
                <Plus className="w-4 h-4 mr-1" /> إضافة خدمة
              </Button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-[400px]">
            {!selectedGroup ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <Layers className="w-12 h-12 mb-4 opacity-20" />
                <p>يرجى اختيار مجموعة خدمات من القائمة لعرض وإدارة الخدمات بداخلها.</p>
              </div>
            ) : isLoadingAddons ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : addons.length === 0 ? (
              <div className="p-12 text-center text-slate-500">لا توجد خدمات داخل هذه المجموعة حالياً. أضف الخدمة الأولى.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50/80 text-slate-600 font-medium border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">الخدمة</th>
                      <th className="py-3 px-4">السعر</th>
                      <th className="py-3 px-4">النوع</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4 w-24">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {addons.map((addon) => (
                      <tr key={addon.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{addon.name?.ar}</p>
                          {addon.description?.ar && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{addon.description.ar}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-700">
                            {addon.price_type === 'percentage' ? `${addon.price}%` : `${addon.price} ج.م`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${addon.type === 'printing_linked' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                            {addon.type === 'printing_linked' ? 'طباعة' : 'عادية'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                           {addon.is_active ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                        </td>
                        <td className="py-3 px-4 flex items-center gap-1">
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => { setEditingAddon(addon); setIsAddonModalOpen(true); }}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => confirmDeleteAddon(addon.id.toString())}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      <AddonGroupFormModal 
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSubmit={handleGroupSubmit}
        isSubmitting={createGroupMutation.isPending || updateGroupMutation.isPending}
        initialData={editingGroup}
      />

      <ProductAddonFormModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
        onSubmit={handleAddonSubmit}
        isSubmitting={createAddonMutation.isPending || updateAddonMutation.isPending}
        initialData={editingAddon}
      />
    </div>
  );
}
