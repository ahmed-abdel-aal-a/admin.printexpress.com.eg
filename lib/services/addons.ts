import { fetcher, apiClient } from "../api";
import { AddonGroup, ProductAddon } from "@/app/addons/types";

export const addonsApi = {
  // ==========================================
  // Addon Groups
  // ==========================================
  getAddonGroups: async (): Promise<AddonGroup[]> => {
    return fetcher("/v1/admin/addon-groups");
  },

  createAddonGroup: async (data: any): Promise<AddonGroup> => {
    return apiClient("/v1/admin/addon-groups", {
      method: "POST",
      body: data,
    });
  },

  updateAddonGroup: async (id: string, data: any): Promise<AddonGroup> => {
    return apiClient(`/v1/admin/addon-groups/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  deleteAddonGroup: async (id: string): Promise<void> => {
    return apiClient(`/v1/admin/addon-groups/${id}`, {
      method: "DELETE",
    });
  },

  // ==========================================
  // Product Addons
  // ==========================================
  getProductAddons: async (groupId: string): Promise<ProductAddon[]> => {
    return fetcher(`/v1/admin/addon-groups/${groupId}/addons`);
  },

  createProductAddon: async (groupId: string, data: any): Promise<ProductAddon> => {
    return apiClient(`/v1/admin/addon-groups/${groupId}/addons`, {
      method: "POST",
      body: data,
    });
  },

  updateProductAddon: async (groupId: string, addonId: string, data: any): Promise<ProductAddon> => {
    return apiClient(`/v1/admin/addon-groups/${groupId}/addons/${addonId}`, {
      method: "PUT",
      body: data,
    });
  },

  deleteProductAddon: async (groupId: string, addonId: string): Promise<void> => {
    return apiClient(`/v1/admin/addon-groups/${groupId}/addons/${addonId}`, {
      method: "DELETE",
    });
  },
};
