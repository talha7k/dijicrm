import type { User } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  serverTimestamp,
  runTransaction,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "$lib/firebase";
import type { UserProfile } from "$lib/types/user";
import type { CompanyMember } from "$lib/types/companyMember";

/**
 * Onboarding Service
 *
 * This service handles the final step of user onboarding where users:
 * 1. Join existing companies (via invitation codes)
 * 2. Create new companies
 * 3. Get their profiles updated with company associations
 * 4. Get membership records created in company subcollections
 *
 * Note: Basic user profiles are created during sign-up in authService.ts
 * This service only enhances those profiles with company information
 */

export interface OnboardingData {
  role: "client" | "company-member" | "create-company";
  invitationCode?: string;
  companyCode?: string;
  companyName?: string;
  companyDescription?: string;
}

export interface CompanyData {
  name: string;
  description?: string;
  ownerId: string;
  code: string;
  createdAt: any;
  updatedAt: any;
  isActive: boolean;
  settings?: {
    timezone: string;
    currency: string;
    language: string;
    emailNotifications: boolean;
  };
  memberCount?: number;
}

/**
 * Updates an existing user profile with company information during onboarding
 */
async function updateExistingProfile(
  user: User,
  onboardingData: OnboardingData,
): Promise<UserProfile> {
  console.log("Updating existing profile with company information");

  // Resolve company ID from invitation or company code
  const companyId = await resolveCompanyId(onboardingData);
  console.log("Resolved company ID:", companyId);

  const userRef = doc(db, "users", user.uid);
  const existingProfile = (await getDoc(userRef)).data() as UserProfile;

  // Update profile with company association
  const updatedProfile: UserProfile = {
    ...existingProfile,
    companyAssociations: [
      ...(existingProfile.companyAssociations || []),
      {
        companyId: companyId,
        role: getCompanyRole(onboardingData.role),
        joinedAt: Timestamp.now(),
      },
    ],
    currentCompanyId: companyId,
    onboardingCompleted: true,
    updatedAt: serverTimestamp() as any,
  };

  // Update the profile
  await setDoc(userRef, updatedProfile, { merge: true });

  // Create or update membership document
  const membershipRef = doc(
    collection(db, `companies/${companyId}/members`),
    user.uid,
  );
  const membershipData: any = {
    id: `${user.uid}-${companyId}`,
    userId: user.uid,
    companyId: companyId,
    role: getCompanyRole(onboardingData.role),
    joinedAt: serverTimestamp(),
    status: "active",
    permissions: getDefaultPermissions(onboardingData.role),
  };

  const membershipDoc = await getDoc(membershipRef);
  if (membershipDoc.exists()) {
    await updateDoc(membershipRef, membershipData);
  } else {
    await setDoc(membershipRef, membershipData);
  }

  console.log("Profile updated successfully");
  return updatedProfile;
}

/**
 * Completes user onboarding by joining a company and updating profile
 */
export async function completeUserOnboarding(
  user: User,
  onboardingData: OnboardingData,
): Promise<UserProfile> {
  console.log("Completing user onboarding:", {
    userId: user.uid,
    onboardingData,
  });

  // Check if profile already exists
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  const profileExists = userDoc.exists();

  console.log("Profile exists:", profileExists);

  // If profile exists, just update it with company info
  if (profileExists) {
    console.log("Updating existing profile with company information");
    return await updateExistingProfile(user, onboardingData);
  }

  // Otherwise, create new profile (for new signups)
  console.log("Creating new profile with company information");
  return await runTransaction(db, async (transaction) => {
    let companyId: string;

    // Handle company creation or lookup based on role
    if (onboardingData.role === "create-company") {
      if (!onboardingData.companyName) {
        throw new Error("Company name is required for company creation");
      }

      console.log("Creating new company:", onboardingData.companyName);

      // Create new company
      const companyData: CompanyData = {
        name: onboardingData.companyName,
        description: onboardingData.companyDescription || "",
        ownerId: user.uid,
        code: generateCompanyCode(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        settings: {
          timezone: "UTC",
          currency: "USD",
          language: "en",
          emailNotifications: true,
        },
        memberCount: 1,
      };

      console.log("Company data to be saved:", companyData);

      const companyRef = doc(collection(db, "companies"));
      transaction.set(companyRef, companyData);
      companyId = companyRef.id;

      console.log("Company created with ID:", companyId);
    } else {
      // For clients and company members, companyId should be determined by validation
      // This would be passed in from the validation step
      if (onboardingData.role === "client" && !onboardingData.invitationCode) {
        throw new Error("Invitation code is required for client onboarding");
      }
      if (
        onboardingData.role === "company-member" &&
        !onboardingData.invitationCode
      ) {
        throw new Error("Invitation code is required for member onboarding");
      }

      // For now, we'll need to implement company lookup based on codes
      // This is a placeholder - actual implementation would validate codes and get companyId
      companyId = await resolveCompanyId(onboardingData);
      console.log("Resolved company ID:", companyId);
    }

    // Create or update user profile
    const existingProfile = profileExists
      ? (userDoc.data() as UserProfile)
      : null;

    const UserProfile: any = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || existingProfile?.displayName || null,
      photoURL: user.photoURL || existingProfile?.photoURL || null,

      // Preserve existing basic info if available
      isActive: true,
      lastLoginAt: serverTimestamp(),
      createdAt: existingProfile?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),

      // Preserve existing preferences if available
      emailNotifications: existingProfile?.emailNotifications ?? true,
      pushNotifications: existingProfile?.pushNotifications ?? false,
      theme: existingProfile?.theme || "system",
      language: existingProfile?.language || "en",

      // Role-based access control
      role:
        onboardingData.role === "create-company"
          ? "company"
          : onboardingData.role === "company-member"
            ? "company"
            : onboardingData.role,
      permissions: getDefaultPermissions(onboardingData.role),

      // Company associations - merge with existing if any
      companyAssociations: [
        ...(existingProfile?.companyAssociations || []),
        {
          companyId: companyId,
          role: getCompanyRole(onboardingData.role),
          joinedAt: new Date(), // Use JavaScript Date - Firestore SDK will convert to Timestamp during transaction
        },
      ],

      // Active company context
      currentCompanyId: companyId,

      // Onboarding completion tracking
      onboardingCompleted: true,

      // Preserve existing metadata if available
      metadata: {
        ...existingProfile?.metadata,
        accountStatus: "active",
      },
    };

    console.log("User profile to be saved:", {
      uid: user.uid,
      companyId,
      role: UserProfile.role,
      profileExists,
      existingAssociations: existingProfile?.companyAssociations?.length || 0,
    });

    // Save or update user profile
    const userRef = doc(db, "users", user.uid);
    if (profileExists) {
      transaction.update(userRef, UserProfile);
    } else {
      transaction.set(userRef, UserProfile);
    }

    // Create or update the corresponding membership document in the company's members subcollection
    const membershipRef = doc(
      collection(db, `companies/${companyId}/members`),
      user.uid,
    );
    const membershipData: any = {
      id: `${user.uid}-${companyId}`,
      userId: user.uid,
      companyId: companyId,
      role: getCompanyRole(onboardingData.role),
      joinedAt: serverTimestamp(), // This is OK outside of arrays
      status: "active",
      permissions: getDefaultPermissions(onboardingData.role),
    };

    // Only add invitedBy for company owners (who invite themselves)
    if (onboardingData.role === "create-company") {
      membershipData.invitedBy = user.uid;
    }

    // Check if membership already exists
    const membershipDoc = await getDoc(membershipRef);
    if (membershipDoc.exists()) {
      transaction.update(membershipRef, membershipData);
      console.log(
        "Company membership updated for user:",
        user.uid,
        "in company:",
        companyId,
      );
    } else {
      transaction.set(membershipRef, membershipData);
      console.log(
        "Company membership created for user:",
        user.uid,
        "in company:",
        companyId,
      );
    }

    console.log("User profile and membership saved successfully");
    return UserProfile;
  });

  // Mark invitation as used if applicable (outside transaction)
  if (onboardingData.invitationCode) {
    try {
      const invitationsRef = collection(db, "invitations");
      const invitationQuery = query(
        invitationsRef,
        where("code", "==", onboardingData.invitationCode),
      );
      const invitationSnapshot = await getDocs(invitationQuery);

      if (!invitationSnapshot.empty) {
        const invitationDoc = invitationSnapshot.docs[0];
        await updateDoc(invitationDoc.ref, {
          status: "used",
          usedBy: user.uid,
          usedAt: serverTimestamp(),
        });
        console.log(
          "Invitation marked as used:",
          onboardingData.invitationCode,
        );
      }
    } catch (error) {
      console.error("Error marking invitation as used:", error);
      // Don't fail the onboarding if invitation marking fails
    }
  }
}

/**
 * Resolves company ID based on onboarding data (invitation code or company code)
 */
async function resolveCompanyId(
  onboardingData: OnboardingData,
): Promise<string> {
  if (onboardingData.role === "client" && onboardingData.invitationCode) {
    // Validate invitation code and return associated company ID
    const response = await fetch("/api/invitations/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: onboardingData.invitationCode }),
    });

    if (!response.ok) {
      throw new Error("Invalid invitation code");
    }

    const data = await response.json();
    return data.company.id;
  }

  if (onboardingData.role === "company-member") {
    if (onboardingData.invitationCode) {
      // Validate invitation code and return associated company ID
      const response = await fetch("/api/invitations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: onboardingData.invitationCode }),
      });

      if (!response.ok) {
        throw new Error("Invalid invitation code");
      }

      const data = await response.json();
      return data.company.id;
    } else if (onboardingData.companyCode) {
      // Validate company code and return company ID
      const response = await fetch("/api/companies/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: onboardingData.companyCode }),
      });

      if (!response.ok) {
        throw new Error("Invalid company code");
      }

      const data = await response.json();
      return data.company.id;
    }
  }

  throw new Error("Unable to resolve company ID from onboarding data");
}

/**
 * Generates a unique company code for new companies
 */
function generateCompanyCode(): string {
  // Generate a random 8-character code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Gets default permissions based on role
 */
function getDefaultPermissions(
  role: "client" | "company-member" | "create-company",
): string[] {
  switch (role) {
    case "client":
      return ["read:orders", "read:documents"];
    case "company-member":
      return [
        "read:orders",
        "write:orders",
        "read:clients",
        "write:clients",
        "read:documents",
        "write:documents",
      ];
    case "create-company":
      return [
        "admin:company",
        "read:orders",
        "write:orders",
        "read:clients",
        "write:clients",
        "read:documents",
        "write:documents",
        "manage:users",
      ];
    default:
      return [];
  }
}

/**
 * Gets the company role based on onboarding role
 */
function getCompanyRole(
  onboardingRole: "client" | "company-member" | "create-company",
): "member" | "admin" | "owner" {
  switch (onboardingRole) {
    case "client":
      return "member"; // Clients are members of companies
    case "company-member":
      return "member";
    case "create-company":
      return "owner";
    default:
      return "member";
  }
}

/**
 * Validates onboarding data before profile creation
 */
export function validateOnboardingData(onboardingData: OnboardingData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!onboardingData.role) {
    errors.push("Role is required");
  }

  if (onboardingData.role === "create-company") {
    if (!onboardingData.companyName?.trim()) {
      errors.push("Company name is required for company creation");
    }
  } else if (onboardingData.role === "client") {
    if (!onboardingData.invitationCode?.trim()) {
      errors.push("Invitation code is required for client onboarding");
    }
  } else if (onboardingData.role === "company-member") {
    if (!onboardingData.invitationCode?.trim()) {
      errors.push("Invitation code is required for member onboarding");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
