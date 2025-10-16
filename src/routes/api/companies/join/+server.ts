import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb, getAuthAdmin } from "$lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import type { Company } from "$lib/types/company";
import type { CompanyMember } from "$lib/types/companyMember";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = getDb();
    const auth = getAuthAdmin();

    // Get current user from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw error(401, "Unauthorized");
    }

    const token = authHeader.substring(7);
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (err) {
      throw error(401, "Invalid token");
    }

    const user = decodedToken;

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
      .collection("companyMembers")
      .where("userId", "==", user.uid)
      .where("companyId", "==", companyId)
      .limit(1)
      .get();

    if (!existingMemberQuery.empty) {
      throw error(409, "User is already a member of this company");
    }

    // Create company member record
    const memberData: CompanyMember = {
      userId: user.uid,
      companyId,
      role: role as "member" | "admin" | "owner",
      joinedAt: Timestamp.now() as any,
      status: "active",
      permissions: [], // Default permissions
    };

    await db.collection("companyMembers").add(memberData);

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
