const API_BASE: string = import.meta.env.PROD
  ? 'https://estate-api.iraq-estate.workers.dev'
  : '';

export function formatPrice(price: number): string {
  if (price >= 1000000000) {
    const bill = price / 1000000000;
    return `${bill.toLocaleString('ar-IQ', { maximumFractionDigits: 1 })} مليار د.ع`;
  }
  if (price >= 1000000) {
    const mill = price / 1000000;
    return `${mill.toLocaleString('ar-IQ', { maximumFractionDigits: 1 })} مليون د.ع`;
  }
  return `${price.toLocaleString('ar-IQ')} د.ع`;
}

export function formatArea(area: number): string {
  return `${area.toLocaleString('ar-IQ')} م²`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ar-IQ');
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export async function safeApiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    let finalUrl: string;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      finalUrl = url;
    } else if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
      finalUrl = `${API_BASE}${url}`;
    } else {
      finalUrl = url;
    }

    const headers = new Headers(options.headers || {});
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let response: Response;

    try {
      response = await fetch(finalUrl, {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'omit'
      });
    } catch (err: any) {
      console.error('NETWORK_ERROR:', err);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'تعذر الاتصال بالخادم'
      };
    }

    const text = await response.text();

    if (!response.ok) {
      try {
        const json = JSON.parse(text);
        return {
          success: false,
          error: json.error || `HTTP_${response.status}`,
          message: json.message || 'Request failed'
        };
      } catch {
        return {
          success: false,
          error: `HTTP_${response.status}`,
          message: text?.slice(0, 200) || 'Server error'
        };
      }
    }

    if (!text) {
      return {
        success: true,
        data: {} as T
      };
    }

    try {
      return {
        success: true,
        data: JSON.parse(text)
      };
    } catch {
      return {
        success: false,
        error: 'PARSE_ERROR',
        message: 'Invalid JSON response'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: err?.message || 'Unknown error'
    };
  }
          }
