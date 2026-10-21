import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-slate-100">
        <DialogHeader className="bg-slate-50/50 pt-8 pb-4 px-6">
          <DialogTitle className="text-xl font-bold text-slate-900 text-right">
            إنشاء طلب جديد
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4 text-right">
          <div className="flex items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-500 font-medium text-center">سيتم ربط نموذج إنشاء الطلب بـ API لاحقاً</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={onClose} className="rounded-xl font-medium">
              إلغاء
            </Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-medium">
              حفظ الطلب
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
