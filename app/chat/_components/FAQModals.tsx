"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type FAQActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title?: string; q?: string; a?: string }) => Promise<void> | void;
  type: "section" | "question";
  defaultValues?: { title?: string; q?: string; a?: string };
  isEdit?: boolean;
};

export function FAQActionModal({
  isOpen,
  onClose,
  onSave,
  type,
  defaultValues,
  isEdit = false,
}: FAQActionModalProps) {
  const [title, setTitle] = useState(defaultValues?.title || "");
  const [q, setQ] = useState(defaultValues?.q || "");
  const [a, setA] = useState(defaultValues?.a || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultValues?.title || "");
      setQ(defaultValues?.q || "");
      setA(defaultValues?.a || "");
    }
  }, [isOpen, defaultValues]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (type === "section" && title.trim()) {
        await onSave({ title: title.trim() });
        onClose();
      } else if (type === "question" && q.trim() && a.trim()) {
        await onSave({ q: q.trim(), a: a.trim() });
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? type === "section"
                ? "تعديل القسم"
                : "تعديل السؤال"
              : type === "section"
              ? "إضافة قسم جديد"
              : "إضافة سؤال جديد"}
          </DialogTitle>
          <DialogDescription>
            {type === "section"
              ? "أدخل عنوان القسم ليظهر في قائمة الأسئلة الشائعة."
              : "أدخل السؤال والإجابة ليظهر للعملاء بشكل واضح."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-8 py-4">
          {type === "section" ? (
            <div className="space-y-2">
              <Label htmlFor="title">عنوان القسم</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: الشحن والتوصيل"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="q">السؤال</Label>
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="اكتب السؤال هنا..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a">الإجابة</Label>
                <Textarea
                  id="a"
                  value={a}
                  onChange={(e) => setA(e.target.value)}
                  placeholder="اكتب الإجابة التفصيلية..."
                  className="resize-none h-24"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleSave}
            disabled={
              isSubmitting ||
              (type === "section"
                ? !title.trim()
                : !q.trim() || !a.trim())
            }
          >
            {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
};

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}: ConfirmDeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "جاري الحذف..." : "تأكيد الحذف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
