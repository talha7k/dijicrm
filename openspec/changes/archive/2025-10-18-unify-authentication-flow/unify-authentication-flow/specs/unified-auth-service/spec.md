# Unified Auth Service Specification

## Purpose

Define the requirements for a centralized authentication service that serves as the single source of truth for all authentication state and operations in the TK-Crm application.

## Requirements

### Requirement: Centralized Auth State Management

The system SHALL provide a unified authentication service that manages all authentication state and operations from a single location.

#### Scenario: Auth service initialization

- **WHEN** the application loads
- **THEN** the auth service SHALL initialize with a 'loading' status
- **AND** check for existing server session
- **AND** hydrate client state based on server validation
- **AND** update status to 'authenticated', 'unauthenticated', or 'needs_onboarding'

#### Scenario: Auth state synchronization

- **WHEN** authentication state changes (sign in, sign out, session refresh)
- **THEN** the auth service SHALL update the centralized state
- **AND** synchronize user profile store
- **AND** synchronize company context store
- **AND** update app store status
- **AND** notify all subscribed components

### Requirement: Unified Authentication Methods

The system SHALL provide consistent authentication methods through the unified service.

#### Scenario: Email authentication

- **WHEN** a user calls `signInWithEmail(email, password)`
- **THEN** the service SHALL validate credentials with Firebase Auth
- **AND** create session cookie via API
- **AND** update user profile in Firestore
- **AND** set auth state to 'authenticated'
- **AND** handle errors with user-friendly messages

#### Scenario: Google authentication

- **WHEN** a user calls `signInWithGoogle()`
- **THEN** the service SHALL initiate Google OAuth flow
- **AND** handle OAuth callback
- **AND** create session cookie via API
- **AND** update user profile in Firestore
- **AND** set auth state to 'authenticated'
- **AND** handle errors with user-friendly messages

#### Scenario: User registration

- **WHEN** a user calls `signUp(email, password, profileData)`
- **THEN** the service SHALL create Firebase Auth user
- **AND** create basic user profile in Firestore
- **AND** create session cookie
- **AND** set auth state to 'needs_onboarding'
- **AND** redirect to onboarding flow

#### Scenario: User sign out

- **WHEN** a user calls `signOut()`
- **THEN** the service SHALL sign out from Firebase Auth
- **AND** clear session cookie
- **AND** reset all auth-related stores
- **AND** set auth state to 'unauthenticated'
- **AND** redirect to sign-in page

### Requirement: Session Management

The system SHALL provide robust session management through the unified service.

#### Scenario: Session validation

- **WHEN** the service initializes or on navigation
- **THEN** the service SHALL validate session with server API
- **AND** handle expired sessions gracefully
- **AND** refresh session when needed
- **AND** update auth state accordingly

#### Scenario: Session refresh

- **WHEN** a session is near expiration
- **THEN** the service SHALL attempt to refresh the session
- **AND** update session cookie
- **AND** maintain user authentication state
- **AND** handle refresh failures appropriately

### Requirement: Error Handling and Recovery

The system SHALL provide comprehensive error handling through the unified service.

#### Scenario: Network errors

- **WHEN** network errors occur during auth operations
- **THEN** the service SHALL provide user-friendly error messages
- **AND** implement retry logic where appropriate
- **AND** maintain consistent app state during errors

#### Scenario: Invalid credentials

- **WHEN** invalid credentials are provided
- **THEN** the service SHALL return clear error messages
- **AND** keep user on sign-in form
- **AND** not change auth state

#### Scenario: Session expiration

- **WHEN** session expires during user activity
- **THEN** the service SHALL detect expiration
- **AND** redirect to sign-in with appropriate message
- **AND** clear expired session data

### Requirement: State Persistence and Recovery

The system SHALL handle state persistence and recovery scenarios.

#### Scenario: Page refresh

- **WHEN** user refreshes the page
- **THEN** the service SHALL recover auth state from session
- **AND** reinitialize user and company data
- **AND** maintain user session without requiring re-login

#### Scenario: Browser close and reopen

- **WHEN** user closes and reopens browser
- **THEN** the service SHALL check for valid session cookie
- **AND** restore authentication state if session is valid
- **AND** redirect to appropriate dashboard

### Requirement: Integration with Existing Stores

The system SHALL integrate seamlessly with existing user and company stores.

#### Scenario: User profile synchronization

- **WHEN** authentication state changes
- **THEN** the service SHALL update the user profile store
- **AND** ensure user data consistency
- **AND** handle profile loading states

#### Scenario: Company context synchronization

- **WHEN** user is authenticated with valid company
- **THEN** the service SHALL update company context store
- **AND** initialize company-specific data
- **AND** handle company switching scenarios

## ADDED Requirements

### Requirement: Auth Service Lifecycle Management

The system SHALL provide proper lifecycle management for the authentication service.

#### Scenario: Service initialization

- **WHEN** the application starts
- **THEN** the auth service SHALL initialize only once
- **AND** prevent multiple initialization attempts
- **AND** provide initialization status to components

#### Scenario: Service cleanup

- **WHEN** the application unloads or user signs out
- **THEN** the auth service SHALL clean up all listeners and subscriptions
- **AND** clear sensitive data from memory
- **AND** reset all internal states

### Requirement: Type Safety and Interfaces

The system SHALL provide strong TypeScript typing for the authentication service.

#### Scenario: Auth state typing

- **WHEN** working with auth state
- **THEN** the service SHALL provide strongly typed interfaces
- **AND** ensure type safety for all auth operations
- **AND** provide autocomplete support in IDEs

#### Scenario: Error type definitions

- **WHEN** handling authentication errors
- **THEN** the service SHALL provide typed error objects
- **AND** categorize errors by type (network, auth, validation)
- **AND** enable type-safe error handling

## MODIFIED Requirements

### Requirement: Authentication State Structure

The system SHALL use a simplified authentication state structure.

#### Scenario: State status enum

- **WHEN** representing authentication state
- **THEN** the service SHALL use status enum instead of multiple booleans
- **AND** support 'loading', 'authenticated', 'unauthenticated', 'needs_onboarding' states
- **AND** ensure states are mutually exclusive

#### Scenario: State immutability

- **WHEN** updating authentication state
- **THEN** the service SHALL treat state as immutable
- **AND** create new state objects for updates
- **AND** prevent direct state mutations

## REMOVED Requirements

### Requirement: Multiple Authentication Providers

_Removed: The existing system has fragmented auth provider handling. This will be centralized in the new service._

### Requirement: Client-side Session Validation

_Removed: Client-side validation is unreliable. All session validation will be server-first._
