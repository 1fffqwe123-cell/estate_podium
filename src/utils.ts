const API_BASE = "https://estate-api.iraq-estate.workers.dev";

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
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const text = await response.text();

    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || text || `HTTP ${response.status}`,
        message: data?.message || data?.error || text || `HTTP ${response.status}`
      };
    }

    return {
      success: true,
      data,
      message: data?.message
    };

  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network Error",
      message: err.message || "Network Error"
    };
  }
}
