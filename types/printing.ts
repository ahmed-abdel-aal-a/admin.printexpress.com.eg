export interface PrintingProductType {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  allow_custom_name: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PrintingProductTypeInput {
  name: string;
  description?: string | null;
  icon?: string | null;
  is_active?: boolean;
  allow_custom_name?: boolean;
  sort_order?: number;
}
