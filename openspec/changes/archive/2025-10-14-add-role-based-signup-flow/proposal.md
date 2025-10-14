## Why

The current signup flow doesn't differentiate between user types, leading to confusion about which dashboard users should access. Clients need a simple way to join existing companies using invitation codes, while company members need to either create new organizations or join existing ones. This enhancement will provide clear role selection during signup and proper routing to appropriate dashboards.

## What Changes

- Add role selection step (Client, Company Member, Create New Company) during signup
- Implement invitation code system for clients to join specific companies
- Add company code system for members to join existing organizations
- Enhance Google OAuth flow to include role selection
- Update user profile schema to store company associations and roles
- Modify routing logic to direct users to correct dashboards based on role
- **BREAKING**: Changes to user signup flow and user profile structure

## Impact

- Affected specs: Need to create new authentication spec or enhance existing user management
- Affected code:
  - `src/lib/components/auth/` - All auth components
  - `src/lib/types/user.ts` - User profile interface
  - `src/lib/stores/user.ts` - User state management
  - `src/routes/(auth)/sign-up/` - Signup flow
  - `src/routes/(auth)/sign-in/` - Signin flow for role-based routing
  - `src/routes/(app)/dashboard/` - Dashboard routing logic
