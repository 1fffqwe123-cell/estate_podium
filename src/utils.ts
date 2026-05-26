// In production builds the SPA makes direct cross-origin requests, so we need
// the full Cloudflare Workers base URL.  In development Vite's proxy forwards
// /api/* → https://estate-api.iraq-estate.workers.dev (server-to-server, no CORS).
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
  } catch (e) {
    return dateString;
  }
}

export async function safeApiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    // Resolve the final URL:
    // - Already absolute (http:// / https://): use as-is
    // - Relative /api/* or /uploads/*: prepend API_BASE
    //     Dev  → '' + '/api/...' = '/api/...'  (Vite proxy handles it, no CORS)
    //     Prod → 'https://estate-api.iraq-estate.workers.dev' + '/api/...'
    // - Anything else: leave unchanged
    let finalUrl: string;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      finalUrl = url;
    } else if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
      finalUrl = `${API_BASE}${url}`;
    } else {
      finalUrl = url;
    }

    // Build headers, injecting JWT from localStorage when available
    const headers = new Headers(options.headers || {});
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const finalOptions: RequestInit = {
      ...options,
      headers,
      // In dev, the Vite proxy handles the request same-origin, so mode/credentials
      // are irrelevant for CORS.  In prod, we need explicit CORS + no credentials.
      mode: 'cors',
      credentials: 'omit',
    };

    let response: Response;
    try {
      response = await fetch(finalUrl, finalOptions);
    } catch (networkErr: any) {
      // True network failure (DNS, TCP, CORS preflight block, etc.)
      console.error(`[Network Exception] fetch() threw for ${finalUrl}:`, networkErr);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: `تعذّر الاتصال بالخادم. تحقق من الاتصال بالإنترنت أو حاول لاحقاً. (${networkErr?.message ?? networkErr})`,
      };
    }

    const rawText = await response.text();

    if (!response.ok) {
      console.error(
        `[API Error] HTTP ${response.status} on ${options.method ?? 'GET'} ${finalUrl}`
      );
      console.error('Raw response text:', rawText);

      try {
        const errJson = JSON.parse(rawText);
        return {
          success: false,
          error: errJson.error || errJson.message || `HTTP ${response.status}`,
          message:
            errJson.message ||
            errJson.error ||
            `فشل الاستجابة: كود الحالة ${response.status}`,
        };
      } catch {
        return {
          success: false,
          error: `HTTP_${response.status}`,
          message: `خطأ من الخادم (${response.status}): ${
            rawText.substring(0, 200) || 'استجابة فارغة'
          }`,
        };
      }
    }

    if (!rawText || rawText.trim() === '') {
      return {
        success: true,
        message: 'استجابة فارغة',
        data: {} as T,
      };
    }

    try {
      const parsed = JSON.parse(rawText);
      return {
        success: true,
        data: parsed,
        message: parsed?.message,
      };
    } catch (parseErr: any) {
      console.error('[API JSON Error] Failed to parse JSON. Raw body:', rawText);
      return {
        success: false,
        error: 'PARSE_ERROR',
        message: `استجابة غير صالحة من الخادم: ${parseErr.message}`,
      };
    }
  } catch (err: any) {
    console.error(`[safeApiFetch] Unexpected error for ${url}:`, err);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: `خطأ غير متوقع: ${err?.message ?? err}`,
    };
  }
}
