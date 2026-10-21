"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, apiClient } from "@/lib/api";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    roles: ["Admin"], // Simplified for now
  });

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => fetcher("/v1/admin/staff"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingStaff) {
        return apiClient(`/v1/admin/staff/${editingStaff.id}`, { method: "PUT", body: data });
      }
      return apiClient("/v1/admin/staff", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient(`/v1/admin/staff/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: any) => {
      alert(err.message || 'لا يمكن حذف هذا الموظف');
    }
  });

  const openModal = (staffMember: any = null) => {
    setEditingStaff(staffMember);
    if (staffMember) {
      setFormData({
        name: staffMember.name,
        email: staffMember.email,
        password: "",
        password_confirmation: "",
        roles: staffMember.roles.length ? staffMember.roles : ["Admin"],
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        roles: ["Admin"],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...formData };
    if (!data.password) {
      delete data.password;
      delete data.password_confirmation;
    }
    saveMutation.mutate(data);
  };

  const isSuperAdmin = (s: any) => s.roles.includes("Super Admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">فريق العمل والموظفين</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة الصلاحيات وحسابات الموظفين</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
        >
          <Plus size={18} /> إضافة موظف
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 font-bold">جاري تحميل الموظفين...</div>
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 font-bold">الاسم</th>
                <th className="py-4 px-6 font-bold">البريد الإلكتروني</th>
                <th className="py-4 px-6 font-bold">الدور</th>
                <th className="py-4 px-6 font-bold text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff?.map((member: any) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {member.name}
                      {isSuperAdmin(member) && <Shield size={14} className="text-amber-500" />}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-500 font-mono" dir="ltr">{member.email}</td>
                  <td className="py-4 px-6">
                    <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold text-xs">
                      {member.roles.join(', ') || 'بدون دور'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(member)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف الموظف؟')) {
                            deleteMutation.mutate(member.id);
                          }
                        }}
                        disabled={isSuperAdmin(member)}
                        className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingStaff ? "تعديل موظف" : "إضافة موظف جديد"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الكامل</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  كلمة المرور {editingStaff && <span className="text-slate-400 font-normal text-xs">(اتركه فارغاً إذا لم ترد التغيير)</span>}
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  required={!!formData.password}
                  value={formData.password_confirmation}
                  onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-left"
                  dir="ltr"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {saveMutation.isPending ? "جاري الحفظ..." : "حفظ الموظف"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
