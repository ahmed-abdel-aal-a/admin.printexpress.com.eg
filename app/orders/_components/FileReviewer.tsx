'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, FileText, Download } from 'lucide-react';

interface FileReviewerProps {
  itemId: number;
  files: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export default function FileReviewer({ itemId, files, status, rejectionReason }: FileReviewerProps) {
  const queryClient = useQueryClient();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [reason, setReason] = useState(rejectionReason || '');

  const updateStatusMutation = useMutation({
    mutationFn: async ({ file_status, file_rejection_reason }: { file_status: string, file_rejection_reason?: string }) => {
      const res = await apiClient(`/orders/items/${itemId}/file-status`, { 
        method: 'PATCH', 
        body: { file_status, file_rejection_reason } 
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      toast.success('تم تحديث حالة الملف بنجاح وإشعار العميل إذا لزم الأمر');
      setIsRejectModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'حدث خطأ أثناء التحديث');
    }
  });

  const handleApprove = () => {
    if (confirm('هل أنت متأكد من قبول هذه الملفات وبدء الطباعة؟')) {
      updateStatusMutation.mutate({ file_status: 'approved' });
    }
  };

  const handleReject = () => {
    if (!reason.trim()) {
      toast.error('يجب إدخال سبب الرفض');
      return;
    }
    updateStatusMutation.mutate({ file_status: 'rejected', file_rejection_reason: reason });
  };

  if (!files || files.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          الملفات المرفوعة للطباعة
        </h4>
        <div>
          {status === 'approved' && <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" /> تم القبول</span>}
          {status === 'rejected' && <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1"><XCircle className="h-3 w-3" /> تم الرفض</span>}
          {status === 'pending' && <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">بانتظار المراجعة</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {files.map((file, idx) => (
          <a
            key={idx}
            href={file}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-md border border-blue-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            تحميل الملف {idx + 1}
          </a>
        ))}
      </div>

      {status === 'rejected' && rejectionReason && (
        <div className="bg-red-50 text-red-800 text-sm p-3 rounded-md border border-red-100">
          <strong>سبب الرفض:</strong> {rejectionReason}
        </div>
      )}

      {status === 'pending' && (
        <div className="flex gap-3 pt-2">
          <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white gap-2" disabled={updateStatusMutation.isPending}>
            <CheckCircle className="h-4 w-4" />
            قبول الملف
          </Button>
          <Button onClick={() => setIsRejectModalOpen(true)} variant="destructive" className="gap-2" disabled={updateStatusMutation.isPending}>
            <XCircle className="h-4 w-4" />
            رفض وطلب تعديل
          </Button>
        </div>
      )}

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض الملف المرفوع</DialogTitle>
            <DialogDescription>
              سيتم إشعار العميل بهذا الرفض مع السبب المكتوب ليتمكن من رفع ملف جديد.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>سبب الرفض (إجباري)</Label>
              <Textarea
                placeholder="مثال: دقة الصورة ضعيفة جداً ولا تصلح للطباعة..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleReject} disabled={updateStatusMutation.isPending}>
              تأكيد الرفض وإرسال إشعار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
