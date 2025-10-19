import { json } from "@sveltejs/kit";
import { brandingService } from "$lib/services/brandingService";
import { getDb } from "$lib/firebase-admin";

export const GET = async ({ url }: { url: URL }) => {
  try {
    const companyId =
      url.searchParams.get("companyId") || "X6C5b2tYbpTn9XNsEkGT";

    console.log(`Testing branding access for company: ${companyId}`);

    // Test branding service load
    const brandingResult = await brandingService.loadBranding(companyId);

    // Also check directly with admin SDK
    const db = getDb();
    let adminBrandingData = null;
    let adminCompanyData = null;

    if (db) {
      try {
        const companyDoc = await db
          .collection("companies")
          .doc(companyId)
          .get();
        if (companyDoc.exists) {
          const companyData = companyDoc.data();
          adminBrandingData = companyData?.brandingConfig;
          adminCompanyData = companyData;
        }
      } catch (adminError) {
        console.error("Admin SDK error:", adminError);
      }
    }

    return json({
      success: true,
      companyId,
      brandingServiceResult: brandingResult,
      adminBrandingData: adminBrandingData
        ? {
            hasLogo: !!adminBrandingData.logoUrl,
            hasStamp: !!adminBrandingData.stampImageUrl,
            
            primaryColor: adminBrandingData.primaryColor,
            secondaryColor: adminBrandingData.secondaryColor,
          }
        : null,
      adminCompanyData: adminCompanyData
        ? {
            name: adminCompanyData.name,
            hasVatNumber: !!adminCompanyData.vatNumber,
            vatNumberLength: adminCompanyData.vatNumber?.length,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Branding test error:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
};
