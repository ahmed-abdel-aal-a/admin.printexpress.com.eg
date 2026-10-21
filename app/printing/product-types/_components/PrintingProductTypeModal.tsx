'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PrintingProductTypeForm } from './PrintingProductTypeForm';
import { PrintingProductType } from '@/types/printing';
import { useCreatePrintingProductType, useUpdatePrintingProductType } from '@/hooks/printing/usePrintingProductTypes';
import { PrintingProductTypeFormValues } from './schema';

interface PrintingProductTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PrintingProductType;
}

export const PrintingProductTypeModal: React.FC<PrintingProductTypeModalProps> = ({ isOpen, onClose, initialData }) => {
  const createMutation = useCreatePrintingProductType();
  const updateMutation = useUpdatePrintingProductType();

  const isEditing = !!initialData;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (data: PrintingProductTypeFormValues) => {
    if (isEditing) {
      updateMutation.mutate({ id: initialData.id, data }, {
        onSuccess: () => onClose()
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onClose()
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">
            {isEditing ? 'تعديل قسم مطبوعات' : 'إضافة قسم مطبوعات جديد'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <PrintingProductTypeForm 
            initialData={initialData} 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
