import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPrintingProductTypes, 
  createPrintingProductType, 
  updatePrintingProductType, 
  deletePrintingProductType 
} from '@/lib/services/printingProductTypesService';
import { PrintingProductTypeInput } from '@/types/printing';
import toast from 'react-hot-toast';

export const usePrintingProductTypes = () => {
  return useQuery({
    queryKey: ['printingProductTypes'],
    queryFn: getPrintingProductTypes,
  });
};

export const useCreatePrintingProductType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPrintingProductType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printingProductTypes'] });
      toast.success('تم إنشاء القسم بنجاح');
    },
    onError: (error: any) => {
      const message = error?.info?.message || error?.message || 'حدث خطأ أثناء الإضافة';
      toast.error(message);
    }
  });
};

export const useUpdatePrintingProductType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PrintingProductTypeInput }) => updatePrintingProductType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printingProductTypes'] });
      toast.success('تم تحديث القسم بنجاح');
    },
    onError: (error: any) => {
      const message = error?.info?.message || error?.message || 'حدث خطأ أثناء التحديث';
      toast.error(message);
    }
  });
};

export const useDeletePrintingProductType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePrintingProductType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printingProductTypes'] });
      toast.success('تم حذف القسم بنجاح');
    },
    onError: (error: any) => {
      const message = error?.info?.message || error?.message || 'حدث خطأ أثناء الحذف';
      toast.error(message);
    }
  });
};
