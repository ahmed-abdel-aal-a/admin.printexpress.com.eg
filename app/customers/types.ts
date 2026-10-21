export type AcquisitionSource = 'direct' | 'facebook' | 'instagram' | 'tiktok' | 'google' | 'snapchat' | 'referral' | 'ai';

export interface BrowsingEvent {
  id: string;
  path: string;
  title: string;
  timestamp: string;
  type: 'enter' | 'view' | 'exit' | 'add_to_cart' | 'checkout' | 'purchase';
}

export interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  ipAddress: string;
  source: AcquisitionSource;
  totalOrders: number;
  totalSpent: number;
  lastSeen: string | null;
  firstSeen: string | null;
  device: string | null;
  visitsCount?: number;
  isGuest?: boolean;
  browsingHistory?: BrowsingEvent[];
}

export interface VisitSession {
  sessionId: string;
  sessionNumber: number;
  startTime: string;
  endTime: string;
  eventsCount: number;
  events: BrowsingEvent[];
  hasPurchase: boolean;
  hasAddToCart: boolean;
}

export interface SourceStatItem {
  source: AcquisitionSource | string;
  visitors: number;
  buyers: number;
  revenue: number;
  percentage: number;
}

export interface CustomerSourceStats {
  total_customers: number;
  sources: SourceStatItem[];
}
