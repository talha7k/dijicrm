import { derived } from "svelte/store";
import { userProfile, profileComplete } from "$lib/services/authService";
import {
  isProfileComplete,
  validateProfileStructure,
  type ValidationResult,
} from "$lib/services/profileValidationService";

// Re-export from unified auth service for backward compatibility
export { userProfile, profileComplete };

// Derived store for profile completeness status (legacy compatibility)
export const profileCompleteness = derived(userProfile, ($userProfile) => {
  if (!$userProfile) {
    return {
      isComplete: false,
      isValidating: false,
      validation: null as ValidationResult | null,
      hasMinimumFields: false,
    };
  }

  const validation = validateProfileStructure($userProfile);
  const isComplete = isProfileComplete($userProfile);

  return {
    isComplete,
    isValidating: false,
    validation,
    hasMinimumFields: validation.isValid,
  };
});

// Helper function to check if profile is ready for app access
export function isProfileReadyForApp(): boolean {
  // This would be used in guards/layouts to check if user can access main app
  // Implementation would check the profileCompleteness derived store
  return false; // Placeholder - would be implemented with proper store subscription
}
