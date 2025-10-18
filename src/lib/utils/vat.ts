/**
 * Centralized VAT configuration utility
 * Supports configurable VAT rates for internationalization
 */

export interface VatConfig {
  rate: number; // VAT rate as decimal (e.g., 0.15 for 15%)
  enabled: boolean;
}

/**
 * Default VAT configuration
 */
const DEFAULT_VAT: VatConfig = {
  rate: 0.15, // 15% default for Saudi Arabia
  enabled: true,
};

/**
 * Current VAT configuration
 */
let currentVat: VatConfig = { ...DEFAULT_VAT };

/**
 * Set the VAT configuration
 */
export function setVatConfig(config: Partial<VatConfig>): void {
  currentVat = { ...currentVat, ...config };
}

/**
 * Get the current VAT configuration
 */
export function getVatConfig(): VatConfig {
  return { ...currentVat };
}

/**
 * Calculate VAT amount for a given amount
 */
export function calculateVat(amount: number): number {
  if (!currentVat.enabled) return 0;
  return amount * currentVat.rate;
}

/**
 * Get VAT rate as percentage
 */
export function getVatRate(): number {
  return currentVat.rate * 100;
}

/**
 * Initialize VAT from company settings
 * This should be called when company context changes
 */
export function initializeVatFromCompany(vatAmount?: number): void {
  if (vatAmount !== undefined) {
    // If vatAmount is provided, calculate rate (assuming it's for a base amount)
    // But since we don't have the base amount, we'll use the provided rate or default
    setVatConfig({ rate: vatAmount / 100 || DEFAULT_VAT.rate, enabled: true });
  } else {
    setVatConfig(DEFAULT_VAT);
  }
}

/**
 * Reset to default VAT
 */
export function resetToDefaultVat(): void {
  setVatConfig(DEFAULT_VAT);
}
