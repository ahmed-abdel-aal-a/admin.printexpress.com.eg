import { ShippingAdapter } from './types';
import { BostaAdapter } from './adapters/bosta';
import { AramexAdapter } from './adapters/aramex';

class ShippingService {
  private adapters: Map<string, ShippingAdapter> = new Map();

  constructor() {
    // تسجيل الشركات المدعومة
    this.registerAdapter(new BostaAdapter());
    this.registerAdapter(new AramexAdapter());
    // يمكن إضافة باقي الشركات هنا بنفس النمط (Mylerz, Sprint, R2S...)
  }

  registerAdapter(adapter: ShippingAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  getAdapter(id: string): ShippingAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new Error(`لم يتم العثور على مزود خدمة الشحن: ${id}`);
    }
    return adapter;
  }
  
  getAvailableAdapters(): string[] {
      return Array.from(this.adapters.keys());
  }
}

export const shippingService = new ShippingService();
