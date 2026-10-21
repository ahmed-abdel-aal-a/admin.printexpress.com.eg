import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getPrintingTypes, getPrintingType, createPrintingType, updatePrintingType, deletePrintingType,
  getPrintingAttributes, createPrintingAttribute, updatePrintingAttribute, deletePrintingAttribute,
  getPrintingAttributeValues, createPrintingAttributeValue, updatePrintingAttributeValue, deletePrintingAttributeValue,
  getPrintingVolumeDiscounts, createPrintingVolumeDiscount, updatePrintingVolumeDiscount, deletePrintingVolumeDiscount
} from '@/lib/services/printingTypesService';
import {
  PrintingTypeInput,
  PrintingAttributeInput,
  PrintingAttributeValueInput,
  PrintingVolumeDiscountInput
} from '@/types/printing-options';

const getErrorMessage = (error: any, fallback: string): string => {
  return error?.message || error?.info?.message || error?.response?.data?.message || fallback;
};

// --- Printing Types Hooks ---
export const usePrintingTypes = (productTypeId?: number) => {
  return useQuery({
    queryKey: ['printingTypes', productTypeId],
    queryFn: () => getPrintingTypes(productTypeId),
  });
};

export const usePrintingType = (id: number) => {
  return useQuery({
    queryKey: ['printingType', id],
    queryFn: () => getPrintingType(id),
    enabled: !!id,
  });
};

export const useCreatePrintingType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PrintingTypeInput) => createPrintingType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printingTypes'] });
      toast.success('تم إضافة نوع الطباعة بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء إضافة نوع الطباعة'));
    },
  });
};

export const useUpdatePrintingType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PrintingTypeInput> }) => updatePrintingType(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['printingTypes'] });
      queryClient.invalidateQueries({ queryKey: ['printingType', id] });
      toast.success('تم تحديث نوع الطباعة بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء تحديث نوع الطباعة'));
    },
  });
};

export const useDeletePrintingType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePrintingType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printingTypes'] });
      toast.success('تم حذف نوع الطباعة بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء حذف نوع الطباعة'));
    },
  });
};

// --- Printing Attributes Hooks ---
export const useCreatePrintingAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PrintingAttributeInput) => createPrintingAttribute(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['printingType', variables.printing_type_id] });
      toast.success('تم إضافة الخاصية بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء إضافة الخاصية'));
    },
  });
};

export const useUpdatePrintingAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, typeId }: { id: number; data: Partial<PrintingAttributeInput>; typeId: number }) => updatePrintingAttribute(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['printingType', variables.typeId] });
      toast.success('تم تحديث الخاصية بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء تحديث الخاصية'));
    },
  });
};

export const useDeletePrintingAttribute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, typeId }: { id: number; typeId: number }) => deletePrintingAttribute(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['printingType', variables.typeId] });
      toast.success('تم حذف الخاصية بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء حذف الخاصية'));
    },
  });
};

// --- Printing Attribute Values Hooks ---
export const useCreatePrintingAttributeValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PrintingAttributeValueInput) => createPrintingAttributeValue(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['printingType'] }); // Invalidate all type details to refresh nested relations
      toast.success('تم إضافة القيمة بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء إضافة القيمة'));
    },
  });
};

export const useUpdatePrintingAttributeValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PrintingAttributeValueInput> }) => updatePrintingAttributeValue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printingType'] });
      toast.success('تم تحديث القيمة بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء تحديث القيمة'));
    },
  });
};

export const useDeletePrintingAttributeValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePrintingAttributeValue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printingType'] });
      toast.success('تم حذف القيمة بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء حذف القيمة'));
    },
  });
};

// --- Printing Volume Discounts Hooks ---
export const useCreatePrintingVolumeDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PrintingVolumeDiscountInput) => createPrintingVolumeDiscount(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['printingType', variables.printing_type_id] });
      toast.success('تم إضافة الخصم بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء إضافة الخصم'));
    },
  });
};

export const useUpdatePrintingVolumeDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, typeId }: { id: number; data: Partial<PrintingVolumeDiscountInput>; typeId: number }) => updatePrintingVolumeDiscount(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['printingType', variables.typeId] });
      toast.success('تم تحديث الخصم بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء تحديث الخصم'));
    },
  });
};

export const useDeletePrintingVolumeDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, typeId }: { id: number; typeId: number }) => deletePrintingVolumeDiscount(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['printingType', variables.typeId] });
      toast.success('تم حذف الخصم بنجاح');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء حذف الخصم'));
    },
  });
};
