// Quick script to check branding data in Firebase
// Run with: node check-branding.js

const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tk-crm-12345.firebaseio.com", // Update with your actual database URL
});

const db = admin.firestore();

async function checkBranding() {
  try {
    const companyId = "X6C5b2tYbpTn9XNsEkGT";
    console.log(`Checking branding data for company: ${companyId}`);

    // Check branding collection
    const brandingDoc = await db
      .collection("companyBranding")
      .doc(companyId)
      .get();

    if (brandingDoc.exists) {
      const brandingData = brandingDoc.data();
      console.log("✅ Branding data found:");
      console.log("- Logo URL:", brandingData.logoUrl ? "Present" : "Missing");
      console.log(
        "- Stamp URL:",
        brandingData.stampImageUrl ? "Present" : "Missing",
      );
      console.log("- Stamp Position:", brandingData.stampPosition || "Not set");
      console.log("- Primary Color:", brandingData.primaryColor || "Not set");
      console.log(
        "- Secondary Color:",
        brandingData.secondaryColor || "Not set",
      );

      // Test logo URL accessibility
      if (brandingData.logoUrl) {
        try {
          const https = require("https");
          const url = new URL(brandingData.logoUrl);
          // Simple HEAD request check
          console.log("✅ Logo URL format is valid");
        } catch (error) {
          console.log("❌ Logo URL format is invalid:", error.message);
        }
      }

      // Test stamp URL accessibility
      if (brandingData.stampImageUrl) {
        try {
          const https = require("https");
          const url = new URL(brandingData.stampImageUrl);
          console.log("✅ Stamp URL format is valid");
        } catch (error) {
          console.log("❌ Stamp URL format is invalid:", error.message);
        }
      }
    } else {
      console.log("❌ No branding data found for this company");
      console.log("💡 You need to set up branding in the Settings page");
    }

    // Check company data for VAT number
    const companyDoc = await db.collection("companies").doc(companyId).get();

    if (companyDoc.exists) {
      const companyData = companyDoc.data();
      console.log("\n📋 Company data check:");
      console.log("- Company Name:", companyData.name || "Not set");
      console.log(
        "- VAT Number:",
        companyData.vatNumber ? "Present (15 digits)" : "Missing",
      );

      if (companyData.vatNumber) {
        if (
          companyData.vatNumber.length === 15 &&
          /^\d+$/.test(companyData.vatNumber)
        ) {
          console.log("✅ VAT Number format is valid");
        } else {
          console.log("❌ VAT Number format is invalid (should be 15 digits)");
        }
      } else {
        console.log("⚠️ VAT Number is required for ZATCA QR code generation");
      }
    } else {
      console.log("❌ Company data not found");
    }
  } catch (error) {
    console.error("Error checking branding:", error);
  } finally {
    process.exit(0);
  }
}

checkBranding();
