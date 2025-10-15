import { derived } from "svelte/store";
import type { UserProfile } from "$lib/types/user";
import {
  isProfileComplete,
  validateProfileStructure,
  type ValidationResult,
} from "$lib/services/profileValidationService";
import { persisted } from "svelte-persisted-store";

type UserProfileStore = {
  data: UserProfile | undefined;
  loading: boolean;
  error: any;
  update: (data: Partial<UserProfile>) => Promise<void>;
};

export const userProfile = persisted<UserProfileStore>("userProfile", {
  data: undefined,
  loading: true,
  error: null,
  update: async () => {},
});

// Derived store for profile completeness status
export const profileCompleteness = derived(userProfile, ($userProfile) => {
  if (!$userProfile.data) {
    return {
      isComplete: false,
      isValidating: $userProfile.loading,
      validation: null as ValidationResult | null,
      hasMinimumFields: false,
    };
  }

  const validation = validateProfileStructure($userProfile.data);
  const isComplete = isProfileComplete($userProfile.data);

  return {
    isComplete,
    isValidating: $userProfile.loading,
    validation,
    hasMinimumFields: validation.isValid, // Since isProfileComplete uses validateProfileStructure
  };
});

// Helper function to check if profile is ready for app access
export function isProfileReadyForApp(): boolean {
  // This would be used in guards/layouts to check if user can access main app
  // Implementation would check the profileCompleteness derived store
  return false; // Placeholder - would be implemented with proper store subscription
}
