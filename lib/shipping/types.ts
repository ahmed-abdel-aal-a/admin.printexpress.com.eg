export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  city: string;
  state: string; // Governorate
  street: string;
  buildingNumber?: string;
  floor?: string;
  apartment?: string;
  details?: string;
}

export interface PackageDetails {
  weight: number; // in kg
  dimensions?: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  };
  description: string;
  numberOfItems: number;
}

export interface CreateShipmentRequest {
  orderId: string;
  recipient: ShippingAddress;
  package: PackageDetails;
  codAmount?: number; // Cash on delivery amount, if applicable
  notes?: string;
}

export interface CreateShipmentResponse {
  success: boolean;
  trackingNumber?: string;
  labelUrl?: string; // URL to download the AWB (Air Waybill) label
  error?: string;
  rawResponse?: any;
}

export interface TrackShipmentResponse {
  success: boolean;
  status?: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'CANCELED' | 'EXCEPTION';
  trackingDetails?: {
    timestamp: string;
    description: string;
    location?: string;
  }[];
  error?: string;
}

export interface ShippingAdapter {
  id: string;
  name: string;
  initialize(config: Record<string, string>): void;
  createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse>;
  trackShipment(trackingNumber: string): Promise<TrackShipmentResponse>;
  cancelShipment?(trackingNumber: string): Promise<boolean>;
}
