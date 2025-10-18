/**
 * Centralized currency formatting utility
 * Supports configurable currency codes for internationalization
 */

export interface CurrencyConfig {
  code: string;
  locale?: string;
  symbol?: string;
}

/**
 * Default currency configuration
 */
const DEFAULT_CURRENCY: CurrencyConfig = {
  code: "SAR",
  locale: "en-US",
  symbol: "SAR",
};

/**
 * Current currency configuration
 */
let currentCurrency: CurrencyConfig = { ...DEFAULT_CURRENCY };

/**
 * Set the currency configuration
 */
export function setCurrencyConfig(config: Partial<CurrencyConfig>): void {
  currentCurrency = { ...currentCurrency, ...config };
}

/**
 * Get the current currency configuration
 */
export function getCurrencyConfig(): CurrencyConfig {
  return { ...currentCurrency };
}

/**
 * Format a number as currency using the current configuration
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(currentCurrency.locale || "en-US", {
    style: "currency",
    currency: currentCurrency.code,
  }).format(amount);
}

/**
 * Format currency with a specific currency code (one-time use)
 */
export function formatCurrencyWith(
  amount: number,
  currencyCode: string,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(): string {
  return currentCurrency.symbol || currentCurrency.code;
}

/**
 * Reset to default currency
 */
export function resetToDefaultCurrency(): void {
  setCurrencyConfig(DEFAULT_CURRENCY);
}
