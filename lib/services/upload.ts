import { apiClient } from "../api";

export const uploadService = {
  /**
   * Uploads an image file to the backend
   * @param file The file to upload
   * @returns { url: string } The public URL of the uploaded image
   */
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await apiClient("/v1/admin/upload", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
    
    return response as { url: string };
  },
};
