import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb, getAuthAdmin } from "$lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import type { Company } from "$lib/types/company";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");
    const auth = getAuthAdmin();
    if (!auth) throw new Error("Auth not initialized");

    // Get current user from locals (set by auth hooks)
    const user = locals.user;
    if (!user || !user.uid || !user.email) {
      throw error(401, "Unauthorized");
    }

    const { name, description } = await request.json();

    if (!name || typeof name !== "string") {
      throw error(400, "Company name is required");
    }

    // Generate unique company code
    let code = generateCompanyCode();

    // Check if code is unique
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      const existing = await db
        .collection("companies")
        .where("code", "==", code)
        .limit(1)
        .get();
      codeExists = !existing.empty;
      if (codeExists) {
        code = generateCompanyCode();
      }
      attempts++;
    }

    if (codeExists) {
      throw error(500, "Failed to generate unique company code");
    }

    const companyData: Company = {
      name: name.trim(),
      code,
      description: description?.trim(),
      ownerId: user.uid,
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
      settings: {
        timezone: "UTC",
        currency: "USD",
        language: "en",
        emailNotifications: true,
      },
      isActive: true,
      memberCount: 1, // Owner is the first member
    };

    const companyRef = await db!.collection("companies").add(companyData);

    // Create company member entry for the owner
    const memberData = {
      userId: user.uid,
      companyId: companyRef.id,
      role: "owner",
      joinedAt: Timestamp.now(),
      isActive: true,
      permissions: ["read", "write", "admin", "delete"],
    };

    await db!.collection("companyMembers").add(memberData);
    console.log(
      `Created company member entry for owner ${user.uid} in company ${companyRef.id}`,
    );

    return json({
      success: true,
      company: {
        id: companyRef.id,
        name: companyData.name,
        code: companyData.code,
        description: companyData.description,
        ownerId: companyData.ownerId,
        createdAt: companyData.createdAt.toDate().toISOString(),
        updatedAt: companyData.updatedAt.toDate().toISOString(),
        settings: companyData.settings,
        isActive: companyData.isActive,
        memberCount: companyData.memberCount,
      },
    });
  } catch (err) {
    console.error("Error creating company:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};

function generateCompanyCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
