export interface PrintingVolumeDiscount {
  id: number;
  printing_type_id: number;
  min_qty: number;
  max_qty: number | null;
  discount_basis_points: number; // Stored in DB as integer (100 = 1%)
  added_production_days: number;
  created_at?: string;
  updated_at?: string;
}

export interface PrintingAttributeValue {
  id: number;
  printing_attribute_id: number;
  value: string;
  label: string;
  fixed_price: number; // Stored in cents
  unit_price: number; // Stored in cents
  multiplier_price: number; // Stored in cents
  weight: number;
  weight_type: 'per_unit' | 'per_sqm';
  tiered_prices: Record<string, any> | null;
  added_production_days: number;
  required_upload_category: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PrintingAttribute {
  id: number;
  printing_type_id: number;
  name: string;
  label: string;
  type: 'select' | 'radio' | 'checkbox' | 'number' | 'multiplier_number';
  step: 'specifications' | 'finishing';
  is_required: boolean;
  sort_order: number;
  min_value: number | null;
  max_value: number | null;
  conditional_rules: Record<string, any> | null;
  linked_upload_category: string | null;
  is_dimension_width: boolean;
  is_dimension_length: boolean;
  values?: PrintingAttributeValue[];
  created_at?: string;
  updated_at?: string;
}

export interface PrintingType {
  id: number;
  printing_product_type_id: number;
  name: string;
  description: string | null;
  image?: string | null;
  pricing_method: 'fixed' | 'attributes_only' | 'area';
  base_price_fixed: number; // Stored in cents
  base_price_unit: number; // Stored in cents
  base_price_multiplier: number; // Stored in cents
  min_quantity: number;
  quantity_step: number;
  min_chargeable_area: number;
  min_chargeable_price: number; // Stored in cents
  is_active: boolean;
  requires_upload: boolean;
  upload_rules: {
    max_files_limit?: number | null;
    allow_additional_attachments?: boolean;
    pricing_by_image_count?: boolean;
    allowed_extensions?: string[];
  } | null;
  upload_categories: string[] | null;
  standard_roll_sizes: number[] | null;
  max_print_width: number | null;
  max_print_length: number | null;
  bleed_margin: number;
  safe_zone: number;
  thickness_factor: number;
  base_production_days: number;
  sort_order: number;
  is_market_sensitive?: boolean;
  market_notice?: string | null;
  attributes?: PrintingAttribute[];
  volumeDiscounts?: PrintingVolumeDiscount[];
  created_at?: string;
  updated_at?: string;
}

export type PrintingTypeInput = Omit<PrintingType, 'id' | 'created_at' | 'updated_at' | 'attributes' | 'volumeDiscounts'>;
export type PrintingAttributeInput = Omit<PrintingAttribute, 'id' | 'created_at' | 'updated_at' | 'values'>;
export type PrintingAttributeValueInput = Omit<PrintingAttributeValue, 'id' | 'created_at' | 'updated_at'>;
export type PrintingVolumeDiscountInput = Omit<PrintingVolumeDiscount, 'id' | 'created_at' | 'updated_at'>;
