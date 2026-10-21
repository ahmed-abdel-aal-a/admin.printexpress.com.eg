import { API_BASE_URL, getAuthToken } from '../api';

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  if (!res.ok) {
    const error: any = new Error('API Request Failed');
    error.status = res.status;
    error.info = await res.json().catch(() => ({}));
    throw error;
  }
  return res.json();
};

export const settingsApi = {
  // General Settings
  getGeneralSettings: () => fetchWithAuth('/v1/admin/settings/general'),
  updateGeneralSettings: (data: any) => fetchWithAuth('/v1/admin/settings/general', { method: 'PUT', body: JSON.stringify(data) }),

  // Shipping
  getShippingCompanies: () => fetchWithAuth('/v1/admin/settings/shipping/companies'),
  updateShippingCompany: (code: string, data: any) => fetchWithAuth(`/v1/admin/settings/shipping/companies/${code}`, { method: 'PUT', body: JSON.stringify(data) }),
  getShippingZones: () => fetchWithAuth('/v1/admin/settings/shipping/zones'),
  updateShippingZones: (data: any) => fetchWithAuth('/v1/admin/settings/shipping/zones', { method: 'PUT', body: JSON.stringify({ zones: data }) }),

  // Payment Gateways
  getPaymentGateways: () => fetchWithAuth('/v1/admin/settings/payment/gateways'),
  updatePaymentGateway: (code: string, data: any) => fetchWithAuth(`/v1/admin/settings/payment/gateways/${code}`, { method: 'PUT', body: JSON.stringify(data) }),
};
