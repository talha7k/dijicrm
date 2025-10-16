import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb } from "$lib/firebase-admin";
import type { Company } from "$lib/types/company";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = getDb();

    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      throw error(400, "Company code is required");
    }

    // Find company by code
    const companyQuery = await db
      .collection("companies")
      .where("code", "==", code.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (companyQuery.empty) {
      throw error(404, "Invalid company code");
    }

    const companyDoc = companyQuery.docs[0];
    const companyData = companyDoc.data() as Company;
    const company: Company & { id: string } = {
      id: companyDoc.id,
      ...companyData,
    };

    return json({
      valid: true,
      company: {
        id: company.id,
        name: company.name,
        description: company.description,
      },
    });
  } catch (err) {
    console.error("Error validating company code:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};
