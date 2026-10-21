export interface AddonGroup {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  } | null;
  input_type: 'checkbox' | 'radio';
  is_required: boolean;
  price_multiplier_type: 'per_item' | 'per_order_line';
  is_active: boolean;
  sort_order: number;
  addons?: ProductAddon[];
}

export interface ProductAddon {
  id: string;
  addon_group_id: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  } | null;
  type: 'simple' | 'printing_linked';
  price: number;
  price_type: 'fixed' | 'percentage';
  printing_type_id: string | null;
  requires_upload: boolean;
  allow_multiple_uploads: boolean;
  max_uploads: number;
  track_inventory: boolean;
  quantity: number;
  is_active: boolean;
  sort_order: number;
}
