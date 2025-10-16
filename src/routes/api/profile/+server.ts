import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb, getAuthAdmin } from "$lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import type { UserProfile } from "$lib/types/user";
import { validateProfileStructure } from "$lib/services/profileValidationService";
import { invalidateProfileCache } from "$lib/utils/profile-cache";

// GET /api/profile - Get current user profile
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    // Get user from locals (set by auth hooks)
    const user = locals.user;
    if (!user || !user.uid || !user.email) {
      throw error(401, "Unauthorized");
    }

    const userRef = db.collection("users").doc(user.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw error(404, "User profile not found");
    }

    const userProfile = userSnap.data() as UserProfile;

    return json({
      profile: userProfile,
      validation: validateProfileStructure(userProfile),
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};

// PUT /api/profile - Update user profile
export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    const user = locals.user;
    if (!user || !user.uid || !user.email) {
      throw error(401, "Unauthorized");
    }

    const updates = await request.json();

    // Validate update fields (prevent updating critical fields)
    const allowedFields = [
      "firstName",
      "lastName",
      "username",
      "bio",
      "phoneNumber",
      "emailNotifications",
      "pushNotifications",
      "theme",
      "language",
      "address",
    ];

    const filteredUpdates: Partial<UserProfile> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        (filteredUpdates as any)[key] = value;
      }
    }

    // Add updated timestamp
    filteredUpdates.updatedAt = Timestamp.now() as any;

    const userRef = db.collection("users").doc(user.uid);
    await userRef.update(filteredUpdates);

    // Invalidate cache for this profile
    invalidateProfileCache(user.uid);

    // Get updated profile
    const updatedSnap = await userRef.get();
    const updatedProfile = updatedSnap.data() as UserProfile;

    return json({
      profile: updatedProfile,
      validation: validateProfileStructure(updatedProfile),
    });
  } catch (err) {
    console.error("Error updating user profile:", err);
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};

// POST /api/profile - Create user profile (used during onboarding completion)
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    const user = locals.user;
    if (!user || !user.uid || !user.email) {
      throw error(401, "Unauthorized");
    }

    const profileData = (await request.json()) as Partial<UserProfile>;

    // Ensure required fields are present
    if (!profileData.role || !profileData.currentCompanyId) {
      throw error(400, "Role and currentCompanyId are required");
    }

    // Create complete profile
    const now = Timestamp.now() as any;
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      isActive: true,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
      firstName: profileData.firstName || "",
      lastName: profileData.lastName || "",
      username: profileData.username,
      bio: profileData.bio,
      phoneNumber: profileData.phoneNumber,
      emailNotifications: profileData.emailNotifications ?? true,
      pushNotifications: profileData.pushNotifications ?? true,
      theme: profileData.theme || "system",
      language: profileData.language || "en",
      role: profileData.role,
      permissions: profileData.permissions || [],
      companyAssociations: profileData.companyAssociations || [
        {
          companyId: profileData.currentCompanyId,
          role: profileData.role === "company" ? "owner" : "member",
          joinedAt: now,
        },
      ],
      currentCompanyId: profileData.currentCompanyId,
      address: profileData.address,
      metadata: {
        accountStatus: "active",
        ...profileData.metadata,
      },
      onboardingCompleted: true,
    };

    // Validate the profile
    const validation = validateProfileStructure(newProfile);
    if (!validation.isValid) {
      throw error(400, `Invalid profile: ${validation.errors.join(", ")}`);
    }

    const userRef = db.collection("users").doc(user.uid);
    await userRef.set(newProfile);

    // Invalidate cache for this profile
    invalidateProfileCache(user.uid);

    return json({
      profile: newProfile,
      validation,
    });
  } catch (err) {
    console.error("Error creating user profile:", err);
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};
