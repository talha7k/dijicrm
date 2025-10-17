# Layout Architecture Specification

## Purpose

Define the requirements for streamlining the layout architecture to support the unified authentication flow and eliminate competing navigation guards.

## Requirements

### Requirement: Root Layout Auth Integration

The system SHALL integrate authentication logic into the root layout to provide a single entry point for auth state management.

#### Scenario: Root layout initialization

- **WHEN** the application loads
- **THEN** the root layout SHALL initialize the auth service
- **AND** subscribe to auth state changes
- **AND** provide global loading states
- **AND** handle authentication-based routing

#### Scenario: Auth-based content rendering

- **WHEN** auth state changes
- **THEN** the root layout SHALL render appropriate content
- **AND** show loading state during auth operations
- **AND** render authenticated content when authenticated
- **AND** render auth pages when unauthenticated

#### Scenario: Global error handling

- **WHEN** authentication errors occur
- **THEN** the root layout SHALL display error states
- **AND** provide error recovery options
- **AND** maintain consistent error presentation

### Requirement: App Layout Simplification

The system SHALL simplify the app layout to focus only on UI rendering, removing authentication logic.

#### Scenario: App layout auth state consumption

- **WHEN** the app layout renders
- **THEN** it SHALL consume auth state from auth service
- **AND** NOT perform any authentication operations
- **AND** render based on received auth state

#### Scenario: Dashboard access control

- **WHEN** user attempts to access app routes
- **THEN** the app layout SHALL check auth state
- **AND** render dashboard shell when authenticated with company
- **AND** redirect to onboarding when authenticated but needs onboarding
- **AND** redirect to sign-in when not authenticated

#### Scenario: Company context validation

- **WHEN** rendering app layout
- **THEN** it SHALL validate company context availability
- **AND** render app content only when company is ready
- **AND** handle missing company context gracefully

### Requirement: Auth Layout Preservation

The system SHALL preserve the simple auth layout structure for authentication pages.

#### Scenario: Auth page rendering

- **WHEN** users visit authentication routes
- **THEN** the auth layout SHALL render without auth logic
- **AND** provide centered layout for auth forms
- **AND** maintain consistent styling

#### Scenario: Auth route isolation

- **WHEN** rendering auth pages
- **THEN** the auth layout SHALL isolate from app layout
- **AND** prevent app layout interference
- **AND** provide clean auth experience

### Requirement: Navigation Guard Elimination

The system SHALL eliminate competing navigation guards in favor of centralized auth service routing.

#### Scenario: Centralized routing decisions

- **WHEN** authentication state changes
- **THEN** the auth service SHALL make all routing decisions
- **AND** layouts SHALL NOT implement independent navigation guards
- **AND** prevent competing redirect logic

#### Scenario: Route protection

- **WHEN** protected routes are accessed
- **THEN** the auth service SHALL handle route protection
- **AND** layouts SHALL redirect based on auth service state
- **AND** provide consistent redirect behavior

### Requirement: Loading State Management

The system SHALL provide consistent loading states across all layouts.

#### Scenario: Global loading states

- **WHEN** authentication operations are in progress
- **THEN** layouts SHALL show consistent loading indicators
- **AND** use standardized loading component
- **AND** provide appropriate loading messages

#### Scenario: Progressive loading

- **WHEN** loading different types of content
- **THEN** layouts SHALL show contextual loading states
- **AND** differentiate between auth loading and data loading
- **AND** provide smooth loading transitions

## ADDED Requirements

### Requirement: Server-Side Rendering Integration

The system SHALL integrate server-side rendering with the unified auth flow.

#### Scenario: SSR auth state

- **WHEN** rendering on server
- **THEN** layouts SHALL handle server-provided auth data
- **AND** hydrate client state with server data
- **AND** prevent flickering during hydration

#### Scenario: SEO considerations

- **WHEN** handling authenticated routes
- **THEN** layouts SHALL provide appropriate SEO metadata
- **AND** handle authenticated content properly for search engines

### Requirement: Responsive Design Integration

The system SHALL ensure layouts work seamlessly across all device sizes.

#### Scenario: Mobile auth layouts

- **WHEN** rendering on mobile devices
- **THEN** auth layouts SHALL be optimized for mobile
- **AND** provide touch-friendly authentication interfaces
- **AND** maintain usability across screen sizes

#### Scenario: Responsive app layout

- **WHEN** rendering app layout on different devices
- **THEN** the layout SHALL adapt to screen size
- **AND** provide appropriate navigation patterns
- **AND** maintain functionality across devices

## MODIFIED Requirements

### Requirement: Layout Hierarchy

The system SHALL modify the layout hierarchy to support unified auth flow.

#### Scenario: Layout responsibility separation

- **WHEN** structuring layouts
- **THEN** root layout SHALL handle auth integration
- **AND** app layout SHALL handle authenticated UI
- **AND** auth layout SHALL handle authentication UI
- **AND** each layout SHALL have clear, single responsibility

#### Scenario: Data flow between layouts

- **WHEN** passing data between layouts
- **THEN** data SHALL flow through auth service
- **AND** layouts SHALL NOT directly share auth data
- **AND** maintain clear data boundaries

### Requirement: Route Protection

The system SHALL modify route protection to use centralized auth service.

#### Scenario: Protected route handling

- **WHEN** accessing protected routes
- **THEN** auth service SHALL determine access rights
- **AND** layouts SHALL implement auth service decisions
- **AND** provide consistent protection behavior

## REMOVED Requirements

### Requirement: Multiple Navigation Guards

_Removed: Competing navigation guards in hooks.ts, navigationGuard.ts, and layouts will be eliminated._

### Requirement: Layout-Level Auth Initialization

_Removed: Auth initialization will be centralized in root layout, not scattered across multiple layouts._

### Requirement: Client-Side Auth Validation

_Removed: Client-side auth validation in layouts will be replaced with server-first approach._

### Requirement: Complex Layout State Management

_Removed: Complex state management within layouts will be simplified to consume auth service state._
