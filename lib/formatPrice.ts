/**
 * Format price intelligently based on value
 * - High prices (>1000): 2 decimals
 * - Medium prices (1-1000): 2-4 decimals
 * - Low prices (<1): 4-8 decimals
 */
export function formatPrice(price: number): string {
  if (price >= 1000) {
    // Bitcoin, high value coins: 2 decimals
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } else if (price >= 1) {
    // ETH, BNB, medium value: 2-4 decimals
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });
  } else if (price >= 0.01) {
    // Small coins: 4-6 decimals
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    });
  } else {
    // Very small coins: 6-8 decimals
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 8
    });
  }
}

/**
 * Get decimal places based on price value
 */
export function getPriceDecimals(price: number): number {
  if (price >= 1000) return 2;
  if (price >= 1) return 4;
  if (price >= 0.01) return 6;
  return 8;
}

/**
 * Format percentage
 */
export function formatPercent(percent: number): string {
  return percent.toFixed(4);
}
