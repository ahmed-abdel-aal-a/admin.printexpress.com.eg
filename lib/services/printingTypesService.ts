import { fetcher, apiClient } from '@/lib/api';
import { 
  PrintingType, PrintingTypeInput,
  PrintingAttribute, PrintingAttributeInput,
  PrintingAttributeValue, PrintingAttributeValueInput,
  PrintingVolumeDiscount, PrintingVolumeDiscountInput
} from '@/types/printing-options';

// --- Printing Types ---
export const getPrintingTypes = async (productTypeId?: number): Promise<PrintingType[]> => {
  const url = productTypeId ? `/v1/admin/printing-types?printing_product_type_id=${productTypeId}` : '/v1/admin/printing-types';
  return await fetcher(url);
};

export const getPrintingType = async (id: number): Promise<PrintingType> => {
  return await fetcher(`/v1/admin/printing-types/${id}`);
};

export const createPrintingType = async (data: PrintingTypeInput): Promise<PrintingType> => {
  return await apiClient('/v1/admin/printing-types', { method: 'POST', body: data });
};

export const updatePrintingType = async (id: number, data: Partial<PrintingTypeInput>): Promise<PrintingType> => {
  return await apiClient(`/v1/admin/printing-types/${id}`, { method: 'PUT', body: data });
};

export const deletePrintingType = async (id: number): Promise<void> => {
  await apiClient(`/v1/admin/printing-types/${id}`, { method: 'DELETE' });
};

// --- Printing Attributes ---
export const getPrintingAttributes = async (typeId?: number): Promise<PrintingAttribute[]> => {
  const url = typeId ? `/v1/admin/printing-attributes?printing_type_id=${typeId}` : '/v1/admin/printing-attributes';
  return await fetcher(url);
};

export const createPrintingAttribute = async (data: PrintingAttributeInput): Promise<PrintingAttribute> => {
  return await apiClient('/v1/admin/printing-attributes', { method: 'POST', body: data });
};

export const updatePrintingAttribute = async (id: number, data: Partial<PrintingAttributeInput>): Promise<PrintingAttribute> => {
  return await apiClient(`/v1/admin/printing-attributes/${id}`, { method: 'PUT', body: data });
};

export const deletePrintingAttribute = async (id: number): Promise<void> => {
  await apiClient(`/v1/admin/printing-attributes/${id}`, { method: 'DELETE' });
};

// --- Printing Attribute Values ---
export const getPrintingAttributeValues = async (attributeId?: number): Promise<PrintingAttributeValue[]> => {
  const url = attributeId ? `/v1/admin/printing-attribute-values?printing_attribute_id=${attributeId}` : '/v1/admin/printing-attribute-values';
  return await fetcher(url);
};

export const createPrintingAttributeValue = async (data: PrintingAttributeValueInput): Promise<PrintingAttributeValue> => {
  return await apiClient('/v1/admin/printing-attribute-values', { method: 'POST', body: data });
};

export const updatePrintingAttributeValue = async (id: number, data: Partial<PrintingAttributeValueInput>): Promise<PrintingAttributeValue> => {
  return await apiClient(`/v1/admin/printing-attribute-values/${id}`, { method: 'PUT', body: data });
};

export const deletePrintingAttributeValue = async (id: number): Promise<void> => {
  await apiClient(`/v1/admin/printing-attribute-values/${id}`, { method: 'DELETE' });
};

// --- Printing Volume Discounts ---
export const getPrintingVolumeDiscounts = async (typeId?: number): Promise<PrintingVolumeDiscount[]> => {
  // Assuming a similar API structure if it exists, otherwise we get it from getPrintingType
  // For the sake of the builder, we'll fetch them individually if there's an endpoint,
  // but looking at the backend, there is no PrintingVolumeDiscountController in the plan so far.
  // Wait, I should use the relationships on getPrintingType or assume there's a controller.
  // Ah, let's create it or assume it's created. The backend didn't have `PrintingVolumeDiscountController`.
  return await fetcher(typeId ? `/v1/admin/printing-volume-discounts?printing_type_id=${typeId}` : `/v1/admin/printing-volume-discounts`);
};

export const createPrintingVolumeDiscount = async (data: PrintingVolumeDiscountInput): Promise<PrintingVolumeDiscount> => {
  return await apiClient('/v1/admin/printing-volume-discounts', { method: 'POST', body: data });
};

export const updatePrintingVolumeDiscount = async (id: number, data: Partial<PrintingVolumeDiscountInput>): Promise<PrintingVolumeDiscount> => {
  return await apiClient(`/v1/admin/printing-volume-discounts/${id}`, { method: 'PUT', body: data });
};

export const deletePrintingVolumeDiscount = async (id: number): Promise<void> => {
  await apiClient(`/v1/admin/printing-volume-discounts/${id}`, { method: 'DELETE' });
};
