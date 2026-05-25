export function formatPrice(price: number): string {
  if (price >= 1000000000) {
    const bill = price / 1000000000;
    // Format to 2 decimal places if needed
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
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const response = await fetch(url, options);
    const rawText = await response.text();
    
    if (!response.ok) {
      console.error(`[API Error] HTTP ${response.status} on ${options?.method || 'GET'} ${url}`);
      console.error('Raw response text:', rawText);
      
      try {
        const errJson = JSON.parse(rawText);
        return {
          success: false,
          error: errJson.error || errJson.message || `فشل الاستجابة: كود الحالة ${response.status}`,
          message: errJson.message || errJson.error || `فشل الاستجابة: كود الحالة ${response.status}`
        };
      } catch (e) {
        return {
          success: false,
          error: `خطأ من الخادم (${response.status}): ${rawText.substring(0, 150) || 'استجابة فارغة'}`,
          message: `خطأ من الخادم (${response.status}): ${rawText.substring(0, 150) || 'استجابة فارغة'}`
        };
      }
    }

    if (!rawText || rawText.trim() === '') {
      return {
        success: true,
        message: 'استجابة فارغة',
        data: {} as T
      };
    }

    try {
      const parsed = JSON.parse(rawText);
      return {
        success: true,
        data: parsed,
        message: parsed?.message
      };
    } catch (parseErr: any) {
      console.error('[API JSON Error] Failed to parse JSON. Raw body:', rawText);
      return {
        success: false,
        error: `استجابة غير صالحة من السرفر: ${parseErr.message}`,
        message: `استجابة غير صالحة من السرفر: ${parseErr.message}`
      };
    }
  } catch (err: any) {
    console.error(`[Network Exception] Request failed to ${url}:`, err);
    return {
      success: false,
      error: `فشل الاتصال بالشبكة أو الخادم: ${err.message || err}`,
      message: `فشل الاتصال بالشبكة أو الخادم: ${err.message || err}`
    };
  }
}

