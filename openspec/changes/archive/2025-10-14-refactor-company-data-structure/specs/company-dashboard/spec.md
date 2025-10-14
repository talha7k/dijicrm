## ADDED Requirements

### Requirement: Company-Scoped Data Management

The company dashboard SHALL enforce company-scoped data access for all operations and prevent cross-company data leakage.

#### Scenario: Company data isolation

- **WHEN** a company member accesses any data through the dashboard
- **THEN** the system SHALL ensure all queries include the current company context
- **AND** prevent access to data from other companies
- **AND** validate company context on all CRUD operations

#### Scenario: Company member access control

- **WHEN** a company member views dashboard data
- **THEN** the system SHALL filter data based on their role and permissions
- **AND** show only data relevant to their company context
- **AND** prevent access to administrative functions if not authorized

#### Scenario: Company switching for multi-company users

- **WHEN** a user with multiple company associations uses the dashboard
- **THEN** the system SHALL provide a company switcher interface
- **AND** reload all dashboard data when switching companies
- **AND** maintain separate state for each company context

## MODIFIED Requirements

### Requirement: Company Dashboard Overview

The company dashboard SHALL provide a comprehensive overview of company operations scoped to the current company context and enforce proper data access controls.

#### Scenario: Dashboard data loading

- **WHEN** the company dashboard loads
- **THEN** the system SHALL validate the user's company context
- **AND** load only data belonging to the current company
- **AND** display metrics, invoices, and client information for that company only

#### Scenario: Real-time data updates

- **WHEN** data changes in the current company context
- **THEN** the dashboard SHALL update in real-time
- **AND** ignore changes from other companies
- **AND** maintain company context throughout the session

#### Scenario: Company member role-based display

- **WHEN** users with different roles view the dashboard
- **THEN** the system SHALL display features based on their company role
- **AND** restrict administrative functions to admins and owners
- **AND** provide appropriate data visibility for each role level
