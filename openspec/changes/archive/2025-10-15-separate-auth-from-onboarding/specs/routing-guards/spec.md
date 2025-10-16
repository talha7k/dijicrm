# routing-guards Specification

## Purpose

Implement enhanced routing guards to ensure users have complete profiles before accessing protected application routes.

## ADDED Requirements

### Requirement: Profile Completeness Guard

The system SHALL implement a routing guard that checks for complete user profiles before granting access to protected routes.

#### Scenario: Profile completeness check for protected routes

- **WHEN** a user attempts to access any protected route (/dashboard, /client-dashboard, etc.)
- **THEN** the system SHALL verify the user has a complete profile
- **AND** check for required fields: uid, email, role, currentCompanyId
- **AND** redirect to /onboarding if profile is incomplete

#### Scenario: Profile completeness check validation logic

- **WHEN** validating profile completeness
- **THEN** the system SHALL ensure user profile document exists
- **AND** verify currentCompanyId is not null or undefined
- **AND** confirm role is properly set
- **AND** check companyAssociations array contains valid entries

## MODIFIED Requirements

### Requirement: Authentication Guard Enhancement

The system SHALL enhance existing authentication guards to include profile completeness checks.

#### Scenario: Enhanced authentication guard for (app) routes

- **WHEN** a user accesses any route under the (app) layout group
- **THEN** the system SHALL first verify Firebase authentication
- **AND** then check for complete user profile
- **AND** redirect unauthenticated users to /sign-in
- **AND** redirect authenticated users without profiles to /onboarding

#### Scenario: Authentication guard for onboarding route

- **WHEN** a user accesses the /onboarding route
- **THEN** the system SHALL require Firebase authentication
- **AND** redirect unauthenticated users to /sign-in
- **AND** redirect users with complete profiles to their appropriate dashboard

## ADDED Requirements

### Requirement: Route-Specific Profile Requirements

The system SHALL implement different profile requirements based on the target route.

#### Scenario: Company dashboard profile requirements

- **WHEN** a user attempts to access /dashboard
- **THEN** the system SHALL require a complete profile with company role
- **AND** verify currentCompanyId points to an active company
- **AND** ensure user has admin or member role for the company

#### Scenario: Client dashboard profile requirements

- **WHEN** a user attempts to access /client-dashboard
- **THEN** the system SHALL require a complete profile with client role
- **AND** verify currentCompanyId points to an active company
- **AND** ensure user has client role for the company

## ADDED Requirements

### Requirement: Profile Validation Service

The system SHALL provide a service to validate user profile completeness and validity.

#### Scenario: Profile validation service implementation

- **WHEN** validating a user profile
- **THEN** the system SHALL check all required fields are present
- **AND** validate field formats and constraints
- **AND** verify company associations are valid
- **AND** return detailed validation results

#### Scenario: Profile validation error handling

- **WHEN** profile validation fails
- **THEN** the system SHALL provide specific error messages
- **AND** indicate which fields are missing or invalid
- **AND** guide users to complete the required information

## ADDED Requirements

### Requirement: Navigation State Management

The system SHALL manage navigation state to prevent redirect loops and ensure proper user flow.

#### Scenario: Navigation state tracking

- **WHEN** handling authentication and profile redirects
- **THEN** the system SHALL track the original intended destination
- **AND** prevent infinite redirect loops
- **AND** restore users to their intended page after completing requirements

#### Scenario: Redirect loop prevention

- **WHEN** a user is being redirected
- **THEN** the system SHALL check if they're already on the target page
- **AND** avoid redirecting from a page to itself
- **AND** implement proper redirect chaining logic

## MODIFIED Requirements

### Requirement: Layout Group Route Protection

The system SHALL enhance layout group route protection to include profile validation.

#### Scenario: (auth) layout group protection

- **WHEN** a user accesses routes under (auth) layout group
- **THEN** the system SHALL redirect authenticated users to appropriate dashboards
- **AND** redirect authenticated users without profiles to /onboarding
- **AND** only allow unauthenticated users to access auth pages

#### Scenario: (app) layout group protection

- **WHEN** a user accesses routes under (app) layout group
- **THEN** the system SHALL require both authentication and complete profile
- **AND** redirect users failing either check to appropriate flow
- **AND** prevent access to application features without proper setup

## ADDED Requirements

### Requirement: Profile Status Indicators

The system SHALL provide clear indicators when users are redirected due to profile issues.

#### Scenario: Profile completion redirect messaging

- **WHEN** redirecting users to onboarding due to incomplete profile
- **THEN** the system SHALL display a clear message explaining the redirect
- **AND** indicate what information is needed to complete their profile
- **AND** provide a direct path to complete the required steps

#### Scenario: Authentication status feedback

- **WHEN** authentication or profile checks fail
- **THEN** the system SHALL provide appropriate user feedback
- **AND** explain why access was denied
- **AND** guide users to the correct next steps
