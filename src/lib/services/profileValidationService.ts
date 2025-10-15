import type { UserProfile } from "$lib/types/user";
import { doc, getDoc } from "firebase/firestore";
import { db } from "$lib/firebase";
import { hasCompanyAccess } from "$lib/utils/company-validation";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AsyncValidationResult extends ValidationResult {
  companyExists?: boolean;
}

/**
 * Checks if a user profile is complete and ready for application access
 */
export function isProfileComplete(
  userProfile: UserProfile | null | undefined,
): boolean {
  if (!userProfile) {
    return false;
  }

  const validation = validateProfileStructure(userProfile);
  return validation.isValid;
}

/**
 * Validates the structure and completeness of a user profile
 */
export function validateProfileStructure(
  userProfile: UserProfile,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (
    !userProfile.uid ||
    typeof userProfile.uid !== "string" ||
    userProfile.uid.trim() === ""
  ) {
    errors.push("User ID (uid) is required and must be a non-empty string");
  }

  if (
    !userProfile.email ||
    typeof userProfile.email !== "string" ||
    userProfile.email.trim() === ""
  ) {
    errors.push("Email is required and must be a non-empty string");
  }

  if (!userProfile.role || !["client", "company"].includes(userProfile.role)) {
    errors.push('Role is required and must be either "client" or "company"');
  }

  if (
    !userProfile.currentCompanyId ||
    typeof userProfile.currentCompanyId !== "string" ||
    userProfile.currentCompanyId.trim() === ""
  ) {
    errors.push(
      "Current company ID is required and must be a non-empty string",
    );
  }

  if (userProfile.onboardingCompleted !== true) {
    errors.push("Onboarding must be completed");
  }

  // Optional but recommended fields
  if (!userProfile.displayName) {
    warnings.push(
      "Display name is not set - user experience may be improved with a display name",
    );
  }

  if (!userProfile.createdAt) {
    warnings.push("Created timestamp is missing");
  }

  if (!userProfile.updatedAt) {
    warnings.push("Updated timestamp is missing");
  }

  if (!userProfile.lastLoginAt) {
    warnings.push("Last login timestamp is missing");
  }

  // Company associations validation
  if (
    !userProfile.companyAssociations ||
    userProfile.companyAssociations.length === 0
  ) {
    errors.push("At least one company association is required");
  } else {
    // Validate each company association
    userProfile.companyAssociations.forEach((association, index) => {
      if (!association.companyId) {
        errors.push(`Company association ${index + 1}: companyId is required`);
      }
      if (
        !association.role ||
        !["member", "admin", "owner"].includes(association.role)
      ) {
        errors.push(
          `Company association ${index + 1}: role must be "member", "admin", or "owner"`,
        );
      }
      if (!association.joinedAt) {
        errors.push(
          `Company association ${index + 1}: joinedAt timestamp is required`,
        );
      }
    });
  }

  // Metadata validation
  if (!userProfile.metadata) {
    warnings.push("Metadata object is missing");
  } else {
    if (
      !userProfile.metadata.accountStatus ||
      !["invited", "active", "inactive", "added"].includes(
        userProfile.metadata.accountStatus,
      )
    ) {
      warnings.push("Account status is invalid or missing");
    }
  }

  // Status validation
  if (typeof userProfile.isActive !== "boolean") {
    warnings.push("Active status should be a boolean value");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates if a profile has the minimum required fields for basic functionality
 */
export function hasMinimumRequiredFields(
  userProfile: UserProfile | null | undefined,
): boolean {
  if (!userProfile) {
    return false;
  }

  return !!(
    userProfile.uid &&
    userProfile.email &&
    userProfile.role &&
    userProfile.currentCompanyId &&
    userProfile.onboardingCompleted === true
  );
}

/**
 * Gets a human-readable summary of profile validation issues
 */
export function getValidationSummary(validation: ValidationResult): string {
  if (validation.isValid) {
    return "Profile is complete and valid";
  }

  const errorCount = validation.errors.length;
  const warningCount = validation.warnings.length;

  let summary = `Profile has ${errorCount} error${errorCount !== 1 ? "s" : ""}`;
  if (warningCount > 0) {
    summary += ` and ${warningCount} warning${warningCount !== 1 ? "s" : ""}`;
  }

  if (errorCount > 0) {
    summary += ". First error: " + validation.errors[0];
  }

  return summary;
}

/**
 * Asynchronously validates if a user profile is complete and company exists
 */
export async function isProfileCompleteWithCompanyValidation(
  userProfile: UserProfile | null | undefined,
): Promise<AsyncValidationResult> {
  if (!userProfile) {
    return {
      isValid: false,
      errors: ["User profile is missing"],
      warnings: [],
    };
  }

  // First do basic validation
  const basicValidation = validateProfileStructure(userProfile);
  if (!basicValidation.isValid) {
    return {
      ...basicValidation,
      companyExists: false,
    };
  }

  // Check if company exists in Firestore
  if (!userProfile.currentCompanyId) {
    return {
      isValid: false,
      errors: ["Current company ID is missing"],
      warnings: basicValidation.warnings,
      companyExists: false,
    };
  }

  const companyExists = await validateCompanyExists(
    userProfile.currentCompanyId,
  );
  if (!companyExists) {
    return {
      isValid: false,
      errors: ["Current company does not exist or is inaccessible"],
      warnings: basicValidation.warnings,
      companyExists: false,
    };
  }

  // Verify user has access to the company
  if (!hasCompanyAccess(userProfile, userProfile.currentCompanyId)) {
    return {
      isValid: false,
      errors: ["User does not have access to the current company"],
      warnings: basicValidation.warnings,
      companyExists: true,
    };
  }

  // Verify user has access to the company
  if (!hasCompanyAccess(userProfile, userProfile.currentCompanyId)) {
    return {
      isValid: false,
      errors: ["User does not have access to the current company"],
      warnings: basicValidation.warnings,
      companyExists: true,
    };
  }

  return {
    ...basicValidation,
    companyExists: true,
  };
}

/**
 * Validates if a company exists in Firestore
 */
async function validateCompanyExists(companyId: string): Promise<boolean> {
  if (!companyId) return false;

  try {
    const companyDoc = await getDoc(doc(db, "companies", companyId));
    return companyDoc.exists();
  } catch (error) {
    console.error("Error validating company existence:", error);
    return false;
  }
}
