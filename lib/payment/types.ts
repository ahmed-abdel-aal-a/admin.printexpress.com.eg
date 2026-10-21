export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  paymentUrl?: string; // Redirect the user to this URL
  transactionId?: string;
  error?: string;
}

export interface VerifyPaymentRequest {
  transactionId: string;
  signature: string; // Used to verify the authenticity of the payload
}

export interface PaymentAdapter {
  id: string;
  name: string;
  initialize(config: Record<string, string>): void;
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  verifyPayment(request: VerifyPaymentRequest): Promise<boolean>;
}
