<script lang="ts">
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";
  import AppSidebar from "$lib/components/app/nav/app-sidebar.svelte";
  import AutoBreadcrumb from "$lib/components/shared/auto-breadcrumb.svelte";
  import DarkModeToggle from "$lib/components/shared/dark-mode-toggle.svelte";
  import UserAvatarDropdown from "$lib/components/shared/user-avatar-dropdown.svelte";
  import { Separator } from "$lib/components/ui/separator";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import {
    firekitUser,
    firekitPresence,
    firekitDoc,
    firekitDocMutations,
  } from "svelte-firekit";
  import { userProfile } from "$lib/stores/user";
  import { companyContext } from "$lib/stores/companyContext";
  import { isSidebarOpen } from "$lib/stores/sidebar";
  import type { UserProfile } from "$lib/types/user";
  let { children } = $props();
  const config: any = {
    geolocation: {
      enabled: true,
      type: "custom",
      requireConsent: true,
    },
    sessionTTL: 30 * 60 * 1000, // 30 minutes
    updateInterval: 60 * 1000, // 1 minute
  };
  import { redirectToDashboard } from "$lib/utils/auth";
  import { isProfileCompleteWithCompanyValidation } from "$lib/services/profileValidationService";
  import { doc, getDoc } from "firebase/firestore";
  import { db } from "$lib/firebase";

  // Track if we've already handled initial navigation to prevent loops
  let hasHandledInitialNavigation = $state(false);
  let hasInitializedPresence = $state(false);
  let profileCheckTimeout = $state<NodeJS.Timeout | null>(null);
  let profileRetryCount = $state(0);
  let maxProfileRetries = 3;
  let isValidatingProfile = $state(false);

  $effect(() => {
    if (hasHandledInitialNavigation) return;

    if (firekitUser.initialized && !firekitUser.isAuthenticated) {
      hasHandledInitialNavigation = true;
      goto("/sign-in");
      return;
    }

    // Check profile completeness for authenticated users
    if (firekitUser.initialized && firekitUser.isAuthenticated) {
      const profile = get(userProfile);
      
      console.log("Layout: Checking profile state", {
        hasData: !!profile.data,
        isLoading: profile.loading,
        hasError: !!profile.error,
        profileData: profile.data
      });

      // If profile is loading, wait a bit and check again
      if (profile.loading) {
        if (!profileCheckTimeout) {
          profileCheckTimeout = setTimeout(() => {
            console.log(`Layout: Profile loading timeout after 10 seconds (attempt ${profileRetryCount + 1}/${maxProfileRetries})`);
            
            if (profileRetryCount < maxProfileRetries) {
              // Retry by clearing the timeout and letting the effect run again
              profileRetryCount++;
              profileCheckTimeout = null;
              console.log("Layout: Retrying profile load...");
              
              // Force a refresh of the firekitDoc by clearing and recreating
              if (firekitUser.user) {
                console.log("Layout: Forcing profile refresh for user:", firekitUser.user.uid);
                // The effect will re-run and recreate the firekitDoc
              }
            } else {
              console.log("Layout: Max retries reached, forcing error state");
              // Force loading to false and set error after max retries
              userProfile.update((store) => ({
                ...store,
                loading: false,
                error: "Profile loading failed after multiple attempts. Please refresh the page or try again later.",
              }));
            }
          }, 10000); // 10 second timeout
        }
        return;
      }

      // Clear timeout if we're not loading
      if (profileCheckTimeout) {
        clearTimeout(profileCheckTimeout);
        profileCheckTimeout = null;
      }

      // Check for profile errors
      if (profile.error) {
        console.error("Layout: Profile loading error:", profile.error);
        
        // Try fallback: direct Firestore read
        if (firekitUser.user && profileRetryCount < maxProfileRetries) {
          console.log("Layout: Trying fallback direct Firestore read");
          tryDirectProfileRead();
          return;
        }
        
        hasHandledInitialNavigation = true;
        goto("/onboarding");
        return;
      }

      // Check if profile data exists
      if (!profile.data) {
        console.log("Layout: No profile data found, trying fallback read");
        
        // Try fallback: direct Firestore read
        if (firekitUser.user && profileRetryCount < maxProfileRetries) {
          tryDirectProfileRead();
          return;
        }
        
        console.log("Layout: No profile data found and fallback failed, redirecting to onboarding");
        hasHandledInitialNavigation = true;
        goto("/onboarding");
        return;
      }

      // Check profile completeness with company validation
      if (!isValidatingProfile) {
        isValidatingProfile = true;
        isProfileCompleteWithCompanyValidation(profile.data).then((validation) => {
          isValidatingProfile = false;

          if (!validation.isValid) {
            console.log("Layout: Profile/company validation failed, redirecting to onboarding:", validation.errors);
            hasHandledInitialNavigation = true;
            goto("/onboarding");
            return;
          }

          // Profile exists and is complete with valid company - allow access
          console.log("Layout: Profile and company validation passed, allowing access");
        }).catch((error) => {
          console.error("Layout: Error during profile validation:", error);
          isValidatingProfile = false;
          // On validation error, redirect to onboarding to be safe
          hasHandledInitialNavigation = true;
          goto("/onboarding");
        });
      }
    }
  });

  $effect(() => {
    if (
      firekitUser.initialized &&
      firekitUser.isAuthenticated &&
      !hasInitializedPresence &&
      firekitUser.user
    ) {
      hasInitializedPresence = true;
      // Small delay to ensure user data is stable before initializing presence
      setTimeout(() => {
        if (!firekitPresence.initialized) {
          firekitPresence.initialize(firekitUser.user, config);
        }
      }, 100);
    }
  });

  // Fallback function to directly read profile from Firestore
  async function tryDirectProfileRead() {
    if (!firekitUser.user) return;
    
    try {
      console.log("Layout: Attempting direct profile read for user:", firekitUser.user.uid);
      const profileRef = doc(db, "users", firekitUser.user.uid);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as UserProfile;
        console.log("Layout: Direct profile read successful:", profileData);
        
        // Update the user profile store with the directly fetched data
        userProfile.set({
          data: profileData,
          loading: false,
          error: null,
          update: async (data: Partial<UserProfile>) => {
            // This will be overridden by the main effect, but provide basic implementation
            console.log("Profile update called from fallback:", data);
          }
        });
        
        // Clear any pending timeout
        if (profileCheckTimeout) {
          clearTimeout(profileCheckTimeout);
          profileCheckTimeout = null;
        }
        
        profileRetryCount = 0; // Reset retry count on success
      } else {
        console.log("Layout: No profile found in direct read");
        profileRetryCount++;
      }
    } catch (error) {
      console.error("Layout: Error in direct profile read:", error);
      profileRetryCount++;
    }
  }

  // Redirect to appropriate dashboard based on role after authentication
  $effect(() => {
    const user = get(userProfile);
    if (
      firekitUser.initialized &&
      firekitUser.isAuthenticated &&
      user.data?.role &&
      !hasHandledInitialNavigation
    ) {
      // Only redirect if we're on a generic route like /app
      const currentPath = window.location.pathname;
      if (currentPath === "/app" || currentPath === "/(app)") {
        hasHandledInitialNavigation = true;
        redirectToDashboard();
      }
    }
  });

  $effect(() => {
    const user = firekitUser.user;
    if (user && user.uid) {
      console.log("Layout: Initializing profile for user:", user.uid);
      const doc = firekitDoc<UserProfile>(`users/${user.uid}`);
      
      // Set up profile store with proper error handling
      userProfile.set({
        data: doc.data ?? undefined,
        loading: doc.loading,
        error: doc.error,
        update: async (data: Partial<UserProfile>) => {
          // Optimistic update - update local state immediately
          const currentData = doc.data;
          if (currentData) {
            const { Timestamp } = await import("@firebase/firestore");
            const optimisticData = {
              ...currentData,
              ...data,
              updatedAt: Timestamp.now(),
            };
            userProfile.update((store) => ({ ...store, data: optimisticData }));
          }

          try {
            await firekitDocMutations.update(`users/${user.uid}`, data);

            // Invalidate profile cache after successful update
            const { invalidateProfileCache } = await import(
              "$lib/utils/profile-cache"
            );
            invalidateProfileCache(user.uid);

            // Check for displayName
            if (
              data.displayName &&
              data.displayName !== (user as any).displayName
            ) {
              await (user as any).updateDisplayName(data.displayName);
            }

            if (data.photoURL && data.photoURL !== (user as any).photoURL) {
              await (user as any).updatePhotoURL(data.photoURL);
            }

            if (data.email && data.email !== (user as any).email) {
              await (user as any).updateEmail(data.email);
            }
          } catch (error) {
            // Revert optimistic update on error
            userProfile.update((store) => ({
              ...store,
              data: doc.data ?? undefined,
            }));
            throw error;
          }
        },
      });

      // Log profile state changes for debugging
      console.log("Layout: Profile doc state", {
        hasData: !!doc.data,
        isLoading: doc.loading,
        hasError: !!doc.error,
        error: doc.error,
        userId: user.uid
      });
    } else {
      console.log("Layout: No authenticated user, clearing profile");
      userProfile.set({
        data: undefined,
        loading: false,
        error: null,
        update: async () => {},
      });
    }
  });

  // Keep userProfile store in sync with firekitDoc reactive updates
  $effect(() => {
    const user = firekitUser.user;
    if (user && user.uid) {
      const doc = firekitDoc<UserProfile>(`users/${user.uid}`);

      // Update userProfile store whenever firekitDoc changes
      userProfile.update((store) => ({
        ...store,
        data: doc.data ?? undefined,
        loading: doc.loading,
        error: doc.error,
      }));

      console.log("Layout: FirekitDoc updated, syncing userProfile store", {
        hasData: !!doc.data,
        isLoading: doc.loading,
        hasError: !!doc.error,
        currentCompanyId: doc.data?.currentCompanyId,
        companyAssociationsCount: doc.data?.companyAssociations?.length || 0
      });
    }
  });

  // Initialize company context when user profile data changes
  $effect(() => {
    const profile = get(userProfile);

    // Wait for profile to be fully loaded and validated
    if (profile.data && !profile.loading && !profile.error && !isValidatingProfile) {
      console.log("Layout: Profile data available, initializing company context", {
        currentCompanyId: profile.data.currentCompanyId,
        companyAssociationsCount: profile.data.companyAssociations?.length || 0
      });

      // Add a small delay to ensure all reactive updates are complete
      setTimeout(async () => {
        try {
          console.log("Layout: Calling initializeFromUser");
          await get(companyContext).initializeFromUser();
          console.log("Layout: Company context initialized successfully");
        } catch (error) {
          console.error("Layout: Failed to initialize company context:", error);
        }
      }, 100);
    } else if (profile.error) {
      console.error("Layout: Cannot initialize company context due to profile error:", profile.error);
    } else if (!profile.loading && !profile.data) {
      console.log("Layout: Cannot initialize company context - no profile data");
    } else if (isValidatingProfile) {
      console.log("Layout: Waiting for profile validation before initializing company context");
    } else if (profile.loading) {
      console.log("Layout: Waiting for profile to finish loading before initializing company context");
    }
  });
</script>

<Sidebar.Provider bind:open={$isSidebarOpen}>
  <AppSidebar variant="inset" />
  <Sidebar.Inset>
    <header
      class="flex h-16 shrink-0 items-center justify-between gap-2 border-b"
    >
      <div class="flex items-center gap-2 px-3">
        <AutoBreadcrumb />
      </div>
      <div class="flex items-center gap-2 px-4">
        <DarkModeToggle />
        <UserAvatarDropdown />
      </div>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
