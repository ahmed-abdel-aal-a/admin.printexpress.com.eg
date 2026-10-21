export type OrderStatus =
  | "pending_price_confirmation"
  | "needs_action"
  | "confirmed"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "expired"
  | "trash";

export type PaymentStatus = "paid" | "unpaid" | "cod" | "refunded" | "partially_paid" | "flagged_fraud" | "failed";

export interface OrderItemAddon {
  id: number | string;
  order_item_id?: number | string;
  product_addon_id?: number | string;
  name?: string | Record<string, string>;
  name_snapshot?: string | Record<string, string>;
  price_snapshot?: number | string;
  price_at_purchase?: number | string;
  price?: number | string;
  price_type?: string;
  price_type_snapshot?: string;
  quantity?: number;
  options_snapshot?: any;
  disk?: string;
  file_paths?: string[];
  total?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  item_type?: string;
  custom_product_name?: string;
  printing_type_id?: number | string;
  printing_options?: { 
    physical_quantity?: number; 
    width_mm?: number; 
    length_mm?: number; 
    image_count?: number; 
    notes?: string; 
    selected_options?: any[]; 
    [key: string]: any; 
  };
  uploaded_files?: Record<string, string> | any;
  file_status?: 'pending' | 'approved' | 'rejected' | 'cleaned' | string;
  file_rejection_reason?: string;
  addons?: OrderItemAddon[];
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  total: number;
  itemsCount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingCompany?: string;
  trackingNumber?: string;
  shippingAddress?: string;
  items?: OrderItem[];
  payment_type?: 'full' | 'deposit' | 'cod';
  deposit_percentage?: number;
  deposit_amount?: number;
  remaining_amount?: number;
  deposit_paid_at?: string;
  remaining_paid_at?: string;
  subtotal?: number;
  shipping_cost?: number;
  cod_fee?: number;
  discount_amount?: number;
  tax_amount?: number;
}
