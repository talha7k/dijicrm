import { doc, getDoc } from "firebase/firestore";
import { db } from "$lib/firebase";
import type { UserProfile } from "$lib/types/user";
import { validateProfileStructure } from "$lib/services/profileValidationService";

/**
 * Profile validation cache to improve performance
 * Caches validation results for a short time to avoid repeated validation
 */

interface CachedValidation {
  result: ReturnType<typeof validateProfileStructure>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ProfileValidationCache {
  private cache = new Map<string, CachedValidation>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached validation result for a profile
   */
  get(profileId: string): CachedValidation | null {
    const cached = this.cache.get(profileId);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(profileId);
      return null;
    }

    return cached;
  }

  /**
   * Set validation result in cache
   */
  set(
    profileId: string,
    result: ReturnType<typeof validateProfileStructure>,
    ttl = this.defaultTTL,
  ): void {
    this.cache.set(profileId, {
      result,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache for a specific profile
   */
  clear(profileId: string): void {
    this.cache.delete(profileId);
  }

  /**
   * Clear all expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
const profileValidationCache = new ProfileValidationCache();

// Auto-cleanup expired entries every 10 minutes
setInterval(
  () => {
    profileValidationCache.clearExpired();
  },
  10 * 60 * 1000,
);

/**
 * Cached profile validation with performance optimization
 */
export async function validateProfileWithCache(
  profileId: string,
): Promise<ReturnType<typeof validateProfileStructure>> {
  // Check cache first
  const cached = profileValidationCache.get(profileId);
  if (cached) {
    return cached.result;
  }

  // Fetch profile from database
  const profileRef = doc(db, "users", profileId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    const result = {
      isValid: false,
      errors: ["Profile not found"],
      warnings: [],
    };
    profileValidationCache.set(profileId, result, 30 * 1000); // Cache for 30 seconds
    return result;
  }

  const profile = profileSnap.data() as UserProfile;
  const result = validateProfileStructure(profile);

  // Cache the result
  profileValidationCache.set(profileId, result);

  return result;
}

/**
 * Optimized profile completeness check with caching
 */
export async function isProfileCompleteCached(
  profileId: string,
): Promise<boolean> {
  const validation = await validateProfileWithCache(profileId);
  return validation.isValid;
}

/**
 * Invalidate cache for a profile (call when profile is updated)
 */
export function invalidateProfileCache(profileId: string): void {
  profileValidationCache.clear(profileId);
}

/**
 * Get cache performance statistics
 */
export function getProfileCacheStats() {
  return profileValidationCache.getStats();
}

/**
 * Clear all profile validation cache
 */
export function clearProfileValidationCache(): void {
  profileValidationCache.clearAll();
}
