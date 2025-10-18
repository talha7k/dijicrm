import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb, getAuthAdmin } from "$lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import type { Company } from "$lib/types/company";
import type { CompanyMember } from "$lib/types/companyMember";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");
    const auth = getAuthAdmin();
    if (!auth) throw new Error("Auth not initialized");

    // Get current user from locals (set by hooks.server.ts)
    if (!locals.user) {
      throw error(401, "Unauthorized");
    }

    const user = locals.user;

    const { companyCode, role = "member" } = await request.json();

    if (!companyCode || typeof companyCode !== "string") {
      throw error(400, "Company code is required");
    }

    // Find company by code
    const companyQuery = await db
      .collection("companies")
      .where("code", "==", companyCode.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (companyQuery.empty) {
      throw error(404, "Invalid company code");
    }

    const companyDoc = companyQuery.docs[0];
    const companyData = companyDoc.data() as Company;
    const companyId = companyDoc.id;

    // Check if user is already a member
    const existingMemberQuery = await db
      .collection(`companies/${companyId}/members`)
      .where("userId", "==", user.uid)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (!existingMemberQuery.empty) {
      throw error(409, "User is already a member of this company");
    }

    // Create company member record
    const getPermissionsForRole = (role: string): string[] => {
      switch (role) {
        case "owner":
          return ["read", "write", "admin", "delete"];
        case "admin":
          return ["read", "write", "admin"];
        case "member":
        default:
          return ["read", "write"];
      }
    };

    const memberData: CompanyMember = {
      userId: user.uid,
      companyId,
      role: role as "member" | "admin" | "owner",
      joinedAt: Timestamp.now() as any,
      status: "active",
      permissions: getPermissionsForRole(role),
    };

    await db.collection(`companies/${companyId}/members`).add(memberData);

    // Update company member count
    await companyDoc.ref.update({
      memberCount: companyData.memberCount + 1,
      updatedAt: Timestamp.now(),
    });

    return json({
      success: true,
      company: {
        id: companyId,
        name: companyData.name,
        code: companyData.code,
      },
      membership: {
        role,
        joinedAt: Timestamp.now().toDate().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error joining company:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};
