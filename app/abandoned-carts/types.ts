export type CartStatus = 'pending' | 'recovered' | 'lost';
export type CustomerType = 'registered' | 'guest' | 'anonymous';

export interface CartItem {
  id: number | string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  is_sale_item?: boolean;
}

export interface CartDiscount {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  expires_at?: string;
}

export interface ContactEvent {
  id: number | string;
  type: 'whatsapp' | 'email' | 'sms' | 'push';
  sent_at?: string;
  status: 'sent' | 'delivered' | 'failed' | 'clicked';
}

export interface AbandonedCart {
  id: number | string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_type: CustomerType;
  items: CartItem[];
  total_amount: number;
  abandoned_at: string;
  status: CartStatus;
  recovery_url: string;
  contact_history: ContactEvent[];
  discount?: CartDiscount;
  has_push_permission?: boolean;
}

export interface AbandonedCartsSettings {
  consider_abandoned_after_minutes: number;
  frequency_capping_hours: number;
  enable_push_notifications: boolean;
  push_notification_title: string;
  push_notification_body: string;
  whatsapp_template: string;
  email_subject: string;
  email_template: string;
  enable_discounts: boolean;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  anti_abuse_days: number;
  exclude_sale_items: boolean;
}

