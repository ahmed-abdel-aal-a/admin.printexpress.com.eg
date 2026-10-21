import { fetcher, apiClient, rawFetcher } from "../api";
import { Category, Attribute } from "@/app/products/types";
import toast from "react-hot-toast";

// Helper to invalidate Storefront Cache securely via internal API Route
const revalidateStorefrontCache = async () => {
  try {
    const internalSecret = process.env.NEXT_PUBLIC_INTERNAL_DASHBOARD_SECRET || 'apex_internal_2024';
    const res = await fetch('/api/revalidate-storefront', { 
      method: 'POST',
      headers: { 'x-dashboard-secret': internalSecret }
    });
    
    if (!res.ok) {
      throw new Error('Failed request');
    }
  } catch (error) {
    console.warn("Failed to trigger storefront cache revalidation", error);
    toast.error("تم الحفظ بنجاح، لكن فشل تحديث المتجر (Cache). قد لا تظهر التعديلات فوراً.");
  }
};

export const productsApi = {
  // ==========================================
  // Categories
  // ==========================================
  getCategories: async (): Promise<Category[]> => {
    return fetcher("/v1/admin/categories");
  },

  createCategory: async (data: { name: string; parent_id: string | null; addon_group_ids?: number[] }): Promise<Category> => {
    const res = await apiClient("/v1/admin/categories", {
      method: "POST",
      body: data,
    });
    await revalidateStorefrontCache();
    return res;
  },

  updateCategory: async (id: string, data: { name: string; parent_id: string | null; addon_group_ids?: number[] }): Promise<Category> => {
    const res = await apiClient(`/v1/admin/categories/${id}`, {
      method: "PUT",
      body: data,
    });
    await revalidateStorefrontCache();
    return res;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient(`/v1/admin/categories/${id}`, {
      method: "DELETE",
    });
    await revalidateStorefrontCache();
  },

  bulkDeleteCategories: async (ids: string[]): Promise<any> => {
    const res = await apiClient("/v1/admin/categories/bulk-delete", {
      method: "POST",
      body: { ids },
    });
    await revalidateStorefrontCache();
    return res;
  },

  // ==========================================
  // Attributes
  // ==========================================
  getAttributes: async (): Promise<Attribute[]> => {
    return fetcher("/v1/admin/attributes");
  },

  createAttribute: async (data: { name: string; values: string[] }): Promise<Attribute> => {
    const res = await apiClient("/v1/admin/attributes", {
      method: "POST",
      body: data,
    });
    await revalidateStorefrontCache();
    return res;
  },

  updateAttribute: async (id: string, values: string[]): Promise<Attribute> => {
    const res = await apiClient(`/v1/admin/attributes/${id}`, {
      method: "PUT",
      body: { values },
    });
    await revalidateStorefrontCache();
    return res;
  },

  // ==========================================
  // Products
  // ==========================================
  getProducts: async (params?: { search?: string; category_id?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.category_id) query.append("category_id", params.category_id);
    if (params?.page) query.append("page", params.page.toString());
    
    return rawFetcher(`/v1/admin/products?${query.toString()}`);
  },

  getProduct: async (id: string) => {
    return fetcher(`/v1/admin/products/${id}`);
  },

  createProduct: async (data: any) => {
    const res = await apiClient("/v1/admin/products", {
      method: "POST",
      body: data,
    });
    await revalidateStorefrontCache();
    return res;
  },

  updateProduct: async (id: string, data: any) => {
    const res = await apiClient(`/v1/admin/products/${id}`, {
      method: "PUT",
      body: data,
    });
    await revalidateStorefrontCache();
    return res;
  },

  deleteProduct: async (id: string) => {
    await apiClient(`/v1/admin/products/${id}`, {
      method: "DELETE",
    });
    await revalidateStorefrontCache();
  },

  bulkDeleteProducts: async (ids: string[]) => {
    await apiClient(`/v1/admin/products/bulk-delete`, {
      method: "POST",
      body: { ids },
    });
    await revalidateStorefrontCache();
  },
};
