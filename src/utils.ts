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
