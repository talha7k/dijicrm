# authentication Specification

## Purpose

Separate authentication from user onboarding to ensure all authenticated users have complete profiles before accessing the application.

## ADDED Requirements

### Requirement: Post-Authentication Profile Verification

The system SHALL verify user profile existence immediately after successful authentication and route users appropriately.

#### Scenario: New user profile verification after Google Sign-In

- **WHEN** a user successfully authenticates with Google
- **AND** no user profile exists in Firestore for their uid
- **THEN** the system SHALL redirect them to the onboarding flow
- **AND** prevent access to main application until profile completion

#### Scenario: Existing user profile verification after Google Sign-In

- **WHEN** a returning user successfully authenticates with Google
- **AND** a complete user profile exists in Firestore for their uid
- **THEN** the system SHALL redirect them to their appropriate dashboard
- **AND** bypass the onboarding flow

## MODIFIED Requirements

### Requirement: Google OAuth Integration

The system SHALL integrate profile verification into the Google OAuth authentication flow.

#### Scenario: Google sign-in with profile check

- **WHEN** a user clicks "Sign in with Google"
- **THEN** the system SHALL complete Google authentication
- **AND** immediately check for existing user profile
- **AND** route to onboarding or dashboard based on profile existence

## ADDED Requirements

### Requirement: Onboarding Route Protection

The system SHALL protect the onboarding route to ensure only authenticated users without profiles can access it.

#### Scenario: Onboarding route access control

- **WHEN** an unauthenticated user attempts to access /onboarding
- **THEN** the system SHALL redirect them to sign-in
- **AND** store the intended destination for post-auth redirect

#### Scenario: Complete profile user onboarding access

- **WHEN** a user with a complete profile attempts to access /onboarding
- **THEN** the system SHALL redirect them to their appropriate dashboard
- **AND** prevent redundant onboarding

## ADDED Requirements

### Requirement: Profile Completeness Validation

The system SHALL validate that user profiles contain all required fields before granting application access.

#### Scenario: Incomplete profile detection

- **WHEN** a user profile exists but lacks required fields (currentCompanyId, role)
- **THEN** the system SHALL treat the user as incomplete
- **AND** redirect them to onboarding to complete their profile

#### Scenario: Profile field validation

- **WHEN** validating user profile completeness
- **THEN** the system SHALL require: uid, email, role, currentCompanyId
- **AND** ensure companyAssociations array is not empty
- **AND** verify all timestamps are present

## MODIFIED Requirements

### Requirement: Authentication State Management

The system SHALL manage authentication state separately from user profile state.

#### Scenario: Authentication vs profile state tracking

- **WHEN** tracking user state
- **THEN** the system SHALL maintain separate authentication and profile states
- **AND** allow authenticated users without profiles to access onboarding
- **AND** prevent authenticated users without profiles from accessing main app

## ADDED Requirements

### Requirement: Profile Creation Service

The system SHALL provide a service to create user profiles with proper company associations.

#### Scenario: User profile creation during onboarding

- **WHEN** a user completes onboarding
- **THEN** the system SHALL create a user profile document in Firestore
- **AND** associate the user with selected company
- **AND** set appropriate role and permissions
- **AND** update last login timestamp
