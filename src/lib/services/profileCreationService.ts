import type { User } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "$lib/firebase";
import type { UserProfile } from "$lib/types/user";

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
 * Creates a complete user profile during onboarding
 */
export async function createUserProfile(
  user: User,
  onboardingData: OnboardingData,
): Promise<UserProfile> {
  console.log("Creating user profile:", { userId: user.uid, onboardingData });

  // Use a transaction to ensure data consistency
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
        !onboardingData.companyCode
      ) {
        throw new Error("Company code is required for member onboarding");
      }

      // For now, we'll need to implement company lookup based on codes
      // This is a placeholder - actual implementation would validate codes and get companyId
      companyId = await resolveCompanyId(onboardingData);
      console.log("Resolved company ID:", companyId);
    }

    // Create user profile
    const userProfile: any = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,

      // Authentication and status
      isActive: true,
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      // Profile information (can be expanded later)
      emailNotifications: true,
      pushNotifications: false,
      theme: "system",
      language: "en",

      // Role-based access control
      role:
        onboardingData.role === "create-company"
          ? "company"
          : onboardingData.role === "company-member"
            ? "company"
            : onboardingData.role,
      permissions: getDefaultPermissions(onboardingData.role),

      // Company associations
      companyAssociations: [
        {
          companyId: companyId,
          role: getCompanyRole(onboardingData.role),
          joinedAt: new Date(),
        },
      ],

      // Active company context
      currentCompanyId: companyId,

      // Onboarding completion tracking
      onboardingCompleted: true,

      // Metadata
      metadata: {
        accountStatus: "active",
      },
    };

    console.log("User profile to be saved:", {
      uid: user.uid,
      companyId,
      role: userProfile.role,
    });

    // Save user profile
    const userRef = doc(db, "users", user.uid);
    transaction.set(userRef, userProfile);

    console.log("User profile saved successfully");
    return userProfile;
  });
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

  if (onboardingData.role === "company-member" && onboardingData.companyCode) {
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
    if (!onboardingData.companyCode?.trim()) {
      errors.push("Company code is required for member onboarding");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
