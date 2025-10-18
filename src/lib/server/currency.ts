import { getDb } from "$lib/firebase-admin";
import { setCurrencyConfig } from "$lib/utils/currency";

/**
 * Initialize currency from company settings on the server
 * This should be called in load functions or server-side code
 */
export async function initializeCurrencyFromCompany(
  companyId?: string,
): Promise<void> {
  if (!companyId) return;

  try {
    const db = getDb();

    if (db) {
      const companyDoc = await db.collection("companies").doc(companyId).get();
      if (companyDoc.exists) {
        const companyData = companyDoc.data();
        const currency = companyData?.settings?.currency || "SAR";

        setCurrencyConfig({
          code: currency,
          symbol: currency,
        });
      }
    }
  } catch (error) {
    console.warn("Failed to initialize currency from company settings:", error);
    // Fall back to default
    setCurrencyConfig({ code: "SAR", symbol: "SAR" });
  }
}
