## ADDED Requirements

### Requirement: Company Context Management

The system SHALL provide centralized company context management to ensure all data operations are properly scoped to the user's active company.

#### Scenario: User with single company association

- **WHEN** a user with one company association logs in
- **THEN** the system SHALL automatically set their active company context
- **AND** all data operations SHALL be scoped to this company

#### Scenario: User with multiple company associations

- **WHEN** a user with multiple company associations logs in
- **THEN** the system SHALL prompt them to select an active company
- **AND** provide a company switcher interface
- **AND** all data operations SHALL be scoped to the selected company

#### Scenario: Company context validation

- **WHEN** any data operation is performed
- **THEN** the system SHALL validate the user has access to the current company context
- **AND** prevent operations if company context is invalid

## MODIFIED Requirements

### Requirement: Multi-Tenant User Profile

The system SHALL support user profiles that can be associated with multiple companies and SHALL enforce company-scoped data access for all operations.

#### Scenario: User with multiple company associations

- **WHEN** a user is associated with multiple companies
- **THEN** the system SHALL allow company switching through a centralized interface
- **AND** display appropriate data for the selected company context
- **AND** ensure no data leakage between companies

#### Scenario: Company role assignment

- **WHEN** a user joins a company
- **THEN** the system SHALL assign appropriate role (member, admin, owner)
- **AND** store role permissions for each company association
- **AND** validate company context on all data access

#### Scenario: Client company association validation

- **WHEN** a client user accesses data
- **THEN** the system SHALL validate they are associated with the current company context
- **AND** only allow access to their own data within that company
- **AND** prevent access to other clients' data in the same company
