const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://printexpress.com.eg/api';
  }
  return process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getApiUrl();

/**
 * Helper to get the auth token from wherever it's stored (localStorage, cookies, etc.)
 */
export const getAuthToken = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('token') || '';
    }
  } catch (e) {
    // Safely ignore SSR or local storage access issues
  }
  return '';
};

// Centralized error handler for 401 Unauthorized
const handleResponseError = async (res: Response) => {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      } catch (e) {}
      
      // Prevent multiple concurrent redirects if many requests fail at once
      if (!(window as any).__isRedirectingToLogin) {
        (window as any).__isRedirectingToLogin = true;
        window.location.href = '/login';
      }
    }
  }
  
  const info = await res.json().catch(() => ({}));
  let message = 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.';
  
  if (info?.message) {
    message = info.message;
  }
  
  if (info?.errors) {
    const firstErrorKey = Object.keys(info.errors)[0];
    if (firstErrorKey && info.errors[firstErrorKey][0]) {
      message = info.errors[firstErrorKey][0];
    }
  }

  const error = new Error(message);
  (error as any).info = info;
  (error as any).status = res.status;
  throw error;
};

/**
 * Standard fetcher for SWR
 */
export const fetcher = async (url: string) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${url}`, { headers });

  if (!res.ok) {
    await handleResponseError(res);
  }

  const json = await res.json();
  // Assuming all responses wrap data in a "data" object, but fall back if not
  return json.data !== undefined ? json.data : json;
};

/**
 * Fetcher that returns the raw JSON (useful for paginated endpoints needing meta data)
 */
export const rawFetcher = async (url: string) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${url}`, { headers });

  if (!res.ok) {
    await handleResponseError(res);
  }

  return await res.json();
};

/**
 * Standard fetch wrapper for Mutations (POST, PUT, PATCH, DELETE)
 */
export const apiClient = async (url: string, { method, body, isFormData = false }: { method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: any, isFormData?: boolean }) => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE_URL}${url}`, config);

  if (!res.ok) {
    await handleResponseError(res);
  }

  // Handle empty responses (like 204 No Content)
  if (res.status === 204) return null;
  
  const text = await res.text();
  if (!text) return null;
  
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    // Fallback if backend returns HTML (e.g. 500 Internal Server Error)
    throw new Error('حدث خطأ في الخادم ولم يتم إرجاع بيانات صالحة.');
  }
  return json.data !== undefined ? json.data : json;
};
