import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { Timestamp } from "@firebase/firestore";
import { db } from "$lib/firebase";
import type { UserProfile } from "$lib/types/user";
import { validateProfileStructure } from "$lib/services/profileValidationService";

/**
 * Data validation and cleanup utilities for user profiles and related data
 */

/**
 * Result interface for validation operations
 */
export interface ValidationResult {
  total: number;
  valid: number;
  invalid: number;
  fixed: number;
  errors: string[];
}

/**
 * Validates all user profiles in the database
 */
export async function validateAllUserProfiles(): Promise<ValidationResult> {
  const result: ValidationResult = {
    total: 0,
    valid: 0,
    invalid: 0,
    fixed: 0,
    errors: [],
  };

  try {
    const usersRef = collection(db, "users");
    const usersSnap = await getDocs(usersRef);

    result.total = usersSnap.size;

    for (const userDoc of usersSnap.docs) {
      const profile = userDoc.data() as UserProfile;

      const validation = validateProfileStructure(profile);

      if (validation.isValid) {
        result.valid++;
      } else {
        result.invalid++;
        result.errors.push(
          `Profile ${userDoc.id}: ${validation.errors.join(", ")}`,
        );
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Validation failed: ${error}`);
    return result;
  }
}

/**
 * Attempts to fix common profile validation issues
 */
export async function fixCommonProfileIssues(): Promise<ValidationResult> {
  const result: ValidationResult = {
    total: 0,
    valid: 0,
    invalid: 0,
    fixed: 0,
    errors: [],
  };

  try {
    const usersRef = collection(db, "users");
    const usersSnap = await getDocs(usersRef);

    result.total = usersSnap.size;

    for (const userDoc of usersSnap.docs) {
      const profile = userDoc.data() as UserProfile;
      const validation = validateProfileStructure(profile);

      if (validation.isValid) {
        result.valid++;
        continue;
      }

      // Try to fix common issues
      const fixes: Partial<UserProfile> = {};

      // Fix missing timestamps
      if (!profile.createdAt) {
        fixes.createdAt = Timestamp.now();
      }
      if (!profile.updatedAt) {
        fixes.updatedAt = Timestamp.now();
      }
      if (!profile.lastLoginAt) {
        fixes.lastLoginAt = Timestamp.now();
      }

      // Fix missing required fields with defaults
      if (!profile.emailNotifications) {
        fixes.emailNotifications = true;
      }
      if (!profile.pushNotifications) {
        fixes.pushNotifications = false;
      }
      if (!profile.theme) {
        fixes.theme = "system";
      }
      if (!profile.language) {
        fixes.language = "en";
      }

      // Fix metadata
      if (!profile.metadata) {
        fixes.metadata = {
          accountStatus: "active",
        };
      } else if (!profile.metadata.accountStatus) {
        fixes.metadata = {
          ...profile.metadata,
          accountStatus: "active",
        };
      }

      // Apply fixes if any
      if (Object.keys(fixes).length > 0) {
        await updateDoc(userDoc.ref, fixes);
        result.fixed++;
        console.log(`Fixed profile ${userDoc.id}`);
      } else {
        result.invalid++;
        result.errors.push(
          `Profile ${userDoc.id}: Could not auto-fix - ${validation.errors.join(", ")}`,
        );
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Fix operation failed: ${error}`);
    return result;
  }
}

/**
 * Removes orphaned data (companies without owners, etc.)
 */
export async function cleanupOrphanedData(): Promise<{
  companiesCleaned: number;
  profilesCleaned: number;
  errors: string[];
}> {
  const result = {
    companiesCleaned: 0,
    profilesCleaned: 0,
    errors: [] as string[],
  };

  try {
    // Check for companies without valid owners
    const companiesRef = collection(db, "companies");
    const companiesSnap = await getDocs(companiesRef);

    for (const companyDoc of companiesSnap.docs) {
      const companyData = companyDoc.data();
      const ownerId = companyData.ownerId;

      if (!ownerId) {
        // Company has no owner - this shouldn't happen but clean it up
        await deleteDoc(companyDoc.ref);
        result.companiesCleaned++;
        console.log(`Removed company without owner: ${companyDoc.id}`);
        continue;
      }

      // Check if owner profile exists
      const ownerRef = doc(db, "users", ownerId);
      const ownerSnap = await getDoc(ownerRef);

      if (!ownerSnap.exists()) {
        // Owner doesn't exist - remove company
        await deleteDoc(companyDoc.ref);
        result.companiesCleaned++;
        console.log(
          `Removed company with non-existent owner: ${companyDoc.id}`,
        );
      }
    }

    // Check for profiles with invalid company associations
    const usersRef = collection(db, "users");
    const usersSnap = await getDocs(usersRef);

    for (const userDoc of usersSnap.docs) {
      const profile = userDoc.data() as UserProfile;

      if (
        profile.companyAssociations &&
        profile.companyAssociations.length > 0
      ) {
        const validAssociations = [];

        for (const association of profile.companyAssociations) {
          const companyRef = doc(db, "companies", association.companyId);
          const companySnap = await getDoc(companyRef);

          if (companySnap.exists()) {
            validAssociations.push(association);
          }
        }

        if (validAssociations.length !== profile.companyAssociations.length) {
          await updateDoc(userDoc.ref, {
            companyAssociations: validAssociations,
          });
          console.log(
            `Cleaned invalid company associations for user: ${userDoc.id}`,
          );
        }
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Cleanup failed: ${error}`);
    return result;
  }
}

/**
 * Validates company data integrity
 */
export async function validateCompanyData(): Promise<ValidationResult> {
  const result: ValidationResult = {
    total: 0,
    valid: 0,
    invalid: 0,
    fixed: 0,
    errors: [],
  };

  try {
    const companiesRef = collection(db, "companies");
    const companiesSnap = await getDocs(companiesRef);

    result.total = companiesSnap.size;

    for (const companyDoc of companiesSnap.docs) {
      const company = companyDoc.data();

      // Basic validation
      if (!company.name || !company.ownerId) {
        result.invalid++;
        result.errors.push(`Company ${companyDoc.id} missing required fields`);
        continue;
      }

      // Check if owner exists
      const ownerRef = doc(db, "users", company.ownerId);
      const ownerSnap = await getDoc(ownerRef);

      if (!ownerSnap.exists()) {
        result.invalid++;
        result.errors.push(`Company ${companyDoc.id} has non-existent owner`);
        continue;
      }

      result.valid++;
    }

    return result;
  } catch (error) {
    result.errors.push(`Company validation failed: ${error}`);
    return result;
  }
}

/**
 * Comprehensive data health check
 */
export async function runDataHealthCheck(): Promise<{
  profiles: ValidationResult;
  companies: ValidationResult;
  orphanedData: {
    companiesCleaned: number;
    profilesCleaned: number;
    errors: string[];
  };
  recommendations: string[];
}> {
  console.log("Running comprehensive data health check...");

  const profiles = await validateAllUserProfiles();
  console.log(`Profile validation: ${profiles.valid}/${profiles.total} valid`);

  const companies = await validateCompanyData();
  console.log(
    `Company validation: ${companies.valid}/${companies.total} valid`,
  );

  const orphanedData = await cleanupOrphanedData();
  console.log(
    `Orphaned data cleanup: ${orphanedData.companiesCleaned} companies, ${orphanedData.profilesCleaned} profiles cleaned`,
  );

  const recommendations: string[] = [];

  if (profiles.invalid > 0) {
    recommendations.push(`Fix ${profiles.invalid} invalid user profiles`);
  }

  if (companies.invalid > 0) {
    recommendations.push(`Fix ${companies.invalid} invalid companies`);
  }

  if (orphanedData.companiesCleaned > 0 || orphanedData.profilesCleaned > 0) {
    recommendations.push("Review orphaned data cleanup results");
  }

  return {
    profiles,
    companies,
    orphanedData,
    recommendations,
  };
}
