# Separate Authentication from User Onboarding

## Why

The current authentication system creates a poor user experience by treating authentication and onboarding as a single step. Users who successfully authenticate with Google are immediately redirected to the main application without completing their profile setup, leading to confusion and incomplete user data. This separation is essential for data integrity, user experience, and system scalability.

## What Changes

1. **Authentication Flow**: Modify Google Sign-In to check for existing user profiles before routing
2. **Onboarding Route**: Create dedicated `/onboarding` route for new users to complete profiles
3. **Profile Validation**: Implement profile completeness checks in routing guards
4. **User Profile Service**: Create service for profile creation and validation
5. **Routing Guards**: Enhance existing guards to require complete profiles

## Problem Statement

The current authentication flow combines Google Sign-In authentication with user profile setup in a single process. This creates a poor user experience where users who successfully authenticate with Google are immediately redirected to the main application without completing their profile setup, leading to users "wandering the halls without an office."

## Root Cause

The system treats authentication (verifying identity with Google) as equivalent to user onboarding (creating a profile with company associations). This means:

1. **Authentication Success ≠ Complete Profile**: A user can authenticate with Google but have no user profile in Firestore
2. **Missing Onboarding Check**: The app doesn't verify if a user has completed profile setup after authentication
3. **Routing Logic Gap**: Users are redirected to dashboards without ensuring they have the necessary profile data (companyId, role, etc.)

## Solution Overview

Implement a two-phase authentication system:

1. **Authentication Phase**: Google Sign-In verifies user identity and creates Firebase Auth user
2. **Onboarding Phase**: Check for existing user profile and redirect to onboarding if missing

This ensures every authenticated user has a complete profile before accessing the main application.

## Key Changes Required

1. **Post-Authentication Profile Check**: Immediately after Google Sign-In, check Firestore for user profile
2. **Onboarding Route**: Create dedicated onboarding flow for new users
3. **Profile Creation Logic**: Implement user profile creation with company associations
4. **Routing Guards**: Update auth guards to check for complete profiles
5. **Database Structure**: Ensure proper user profile structure with companyId associations

## Benefits

- **Better UX**: Clear separation between authentication and setup
- **Data Integrity**: Guaranteed profile completeness for all users
- **Simplified Logic**: Cleaner routing and permission checks
- **Scalability**: Foundation for future onboarding enhancements

## Impact Assessment

- **Breaking Changes**: Moderate - affects authentication flow and routing
- **Migration Required**: Existing users without profiles will need onboarding
- **Testing Needed**: Authentication flows, routing logic, profile creation
