import { PaymentAdapter, CreatePaymentRequest, CreatePaymentResponse, VerifyPaymentRequest } from '../types';
import crypto from 'crypto';

export class KashierAdapter implements PaymentAdapter {
  id = 'kashier';
  name = 'Kashier';
  private merchantId: string = '';
  private apiKey: string = ''; // Secret Key
  private baseUrl = 'https://test-api.kashier.io'; // Change to production URL when live

  initialize(config: { merchantId: string; apiKey: string }) {
    this.merchantId = config.merchantId || '';
    this.apiKey = config.apiKey || '';
  }

  // Generate Kashier Hash Signature
  private generateSignature(orderId: string, amount: number, currency: string): string {
    const path = `/?payment=${this.merchantId}.${orderId}.${amount}.${currency}`;
    const hash = crypto.createHmac('sha256', this.apiKey).update(path).digest('hex');
    return hash;
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    if (!this.merchantId || !this.apiKey) {
      throw new Error('بيانات المصادقة لكاشير غير مكتملة (Merchant ID, API Key).');
    }

    try {
      console.log('Initiating Kashier Payment for Order:', request.orderId);

      // Construct the payment hash signature
      const hash = this.generateSignature(request.orderId, request.amount, request.currency);

      // In Kashier, you typically redirect the user to a checkout URL with parameters
      const checkoutUrl = new URL(`https://checkout.kashier.io`);
      checkoutUrl.searchParams.append('merchantId', this.merchantId);
      checkoutUrl.searchParams.append('orderId', request.orderId);
      checkoutUrl.searchParams.append('amount', request.amount.toString());
      checkoutUrl.searchParams.append('currency', request.currency);
      checkoutUrl.searchParams.append('hash', hash);
      checkoutUrl.searchParams.append('merchantRedirect', request.returnUrl);
      checkoutUrl.searchParams.append('serverWebhook', `https://api.yourdomain.com/webhooks/payment/kashier`); // Webhook
      checkoutUrl.searchParams.append('mode', 'test'); // test or live

      // Network delay simulation
      await new Promise(resolve => setTimeout(resolve, 600));

      return {
        success: true,
        paymentUrl: checkoutUrl.toString(),
        transactionId: `KSH-${Math.floor(Math.random() * 1000000)}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'حدث خطأ أثناء إنشاء رابط الدفع مع كاشير',
      };
    }
  }

  // Verify the callback or webhook from Kashier
  async verifyPayment(request: VerifyPaymentRequest): Promise<boolean> {
    // In a real application, you would parse the webhook payload,
    // construct the signature based on Kashier's documentation,
    // and compare it to request.signature.
    
    // Example:
    // const payloadString = `...`; // Construct based on received parameters
    // const expectedSignature = crypto.createHmac('sha256', this.apiKey).update(payloadString).digest('hex');
    // return expectedSignature === request.signature;

    await new Promise(resolve => setTimeout(resolve, 200));
    return true; // Mock true for now
  }
}
