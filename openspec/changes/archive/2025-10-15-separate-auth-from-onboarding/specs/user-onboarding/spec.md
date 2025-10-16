# user-onboarding Specification

## Purpose

Provide a dedicated onboarding flow for new authenticated users to create their profiles and establish company associations.

## ADDED Requirements

### Requirement: Onboarding Flow Entry Point

The system SHALL provide a dedicated onboarding route for new users to complete their profile setup.

#### Scenario: Onboarding route access for new users

- **WHEN** a new authenticated user is redirected to onboarding
- **THEN** the system SHALL display the onboarding welcome screen
- **AND** present role selection options (Client, Company Member, Create Company)
- **AND** pre-fill user information from Google profile

#### Scenario: Onboarding route protection

- **WHEN** an unauthenticated user attempts to access /onboarding
- **THEN** the system SHALL redirect to sign-in page
- **AND** store onboarding as the intended destination

## ADDED Requirements

### Requirement: Role-Based Onboarding Paths

The system SHALL provide different onboarding paths based on the user's selected role.

#### Scenario: Client onboarding path

- **WHEN** a user selects "Client" role during onboarding
- **THEN** the system SHALL prompt for invitation code
- **AND** validate the invitation code belongs to an active company
- **AND** create user profile with client role and company association

#### Scenario: Company member onboarding path

- **WHEN** a user selects "Company Member" role during onboarding
- **THEN** the system SHALL prompt for company code
- **AND** validate the company code matches an existing company
- **AND** create user profile with member role and company association

#### Scenario: Company creation onboarding path

- **WHEN** a user selects "Create Company" role during onboarding
- **THEN** the system SHALL prompt for company details (name, description)
- **AND** create new company record with user as owner
- **AND** create user profile with admin role and company association

## ADDED Requirements

### Requirement: Profile Creation Service

The system SHALL provide a service to create complete user profiles during onboarding.

#### Scenario: User profile creation with company association

- **WHEN** a user completes their onboarding information
- **THEN** the system SHALL create a user profile document in Firestore
- **AND** include all required fields (uid, email, role, currentCompanyId)
- **AND** establish company associations with proper timestamps
- **AND** set initial user preferences and metadata

#### Scenario: Company creation during onboarding

- **WHEN** a user creates a new company during onboarding
- **THEN** the system SHALL create a company document first
- **AND** generate a unique company code for future invitations
- **AND** set the user as the company owner
- **AND** use the new company ID for user profile creation

## ADDED Requirements

### Requirement: Onboarding Progress Tracking

The system SHALL track onboarding progress and handle interruptions gracefully.

#### Scenario: Onboarding step persistence

- **WHEN** a user is in the middle of onboarding
- **THEN** the system SHALL store their progress in session storage
- **AND** allow them to resume from the last completed step
- **AND** handle page refreshes without losing progress

#### Scenario: Onboarding abandonment handling

- **WHEN** a user abandons onboarding midway
- **THEN** the system SHALL keep them in an incomplete state
- **AND** redirect them to onboarding on next login attempt
- **AND** prevent access to main application until completion

## ADDED Requirements

### Requirement: Onboarding Completion Routing

The system SHALL route users to appropriate dashboards immediately after completing onboarding.

#### Scenario: Post-onboarding dashboard routing

- **WHEN** a user successfully completes onboarding
- **THEN** the system SHALL redirect them to their role-appropriate dashboard
- **AND** clients go to /client-dashboard
- **AND** company members/admins go to /dashboard
- **AND** display a success message for first-time users

#### Scenario: Onboarding completion confirmation

- **WHEN** onboarding is completed successfully
- **THEN** the system SHALL show a confirmation screen
- **AND** provide a brief overview of next steps
- **AND** offer a quick tutorial or help resources

## ADDED Requirements

### Requirement: Invitation and Company Code Validation

The system SHALL validate invitation codes and company codes during onboarding.

#### Scenario: Invitation code validation for clients

- **WHEN** a client user enters an invitation code
- **THEN** the system SHALL verify the code exists and is active
- **AND** check if the code has expired
- **AND** ensure the associated company is active
- **AND** prevent reuse of single-use invitation codes

#### Scenario: Company code validation for members

- **WHEN** a company member enters a company code
- **THEN** the system SHALL verify the code matches an existing company
- **AND** ensure the company is active and accepting members
- **AND** prevent access to inactive or suspended companies
