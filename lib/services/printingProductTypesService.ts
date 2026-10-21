import { fetcher, apiClient } from '@/lib/api';
import { PrintingProductType, PrintingProductTypeInput } from '@/types/printing';

export const getPrintingProductTypes = async (): Promise<PrintingProductType[]> => {
  return await fetcher('/v1/admin/printing-product-types');
};

export const createPrintingProductType = async (data: PrintingProductTypeInput): Promise<PrintingProductType> => {
  return await apiClient('/v1/admin/printing-product-types', { method: 'POST', body: data });
};

export const updatePrintingProductType = async (id: number, data: PrintingProductTypeInput): Promise<PrintingProductType> => {
  return await apiClient(`/v1/admin/printing-product-types/${id}`, { method: 'PUT', body: data });
};

export const deletePrintingProductType = async (id: number): Promise<void> => {
  await apiClient(`/v1/admin/printing-product-types/${id}`, { method: 'DELETE' });
};
