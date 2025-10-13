## ADDED Requirements

### Requirement: Company Client Management Interface

Company users SHALL have access to a comprehensive client management interface to view, create, and manage all client accounts associated with their company.

#### Scenario: Access client management

- **WHEN** company user navigates to the clients section
- **THEN** they see a list of all clients with status indicators
- **AND** can filter and search clients by status and other criteria

#### Scenario: Client status overview

- **WHEN** viewing the client list
- **THEN** each client shows clear status (invited, active, inactive)
- **AND** status affects available actions and visual presentation

### Requirement: Proactive Client Creation

Company users SHALL be able to create client accounts proactively without requiring the client to sign up first.

#### Scenario: Create client account

- **WHEN** company user creates a new client
- **THEN** they provide basic information (name, email, company details)
- **AND** system creates an invited client account
- **AND** sends an invitation email to the client

#### Scenario: Client information management

- **WHEN** creating or editing a client
- **THEN** required fields include name, email, and company association
- **AND** optional fields include phone, address, and custom metadata

### Requirement: Client Invitation System

The system SHALL support sending invitations to clients for account activation and provide tracking of invitation status.

#### Scenario: Send client invitation

- **WHEN** company user creates a client account
- **THEN** system automatically sends an invitation email
- **AND** invitation includes secure activation link and instructions

#### Scenario: Invitation status tracking

- **WHEN** company user views client details
- **THEN** they see invitation status (sent, accepted, expired)
- **AND** can resend invitations if needed

### Requirement: Client Account Activation

Clients SHALL be able to activate their accounts through the invitation process and complete their profile setup.

#### Scenario: Accept invitation

- **WHEN** client clicks the invitation link
- **THEN** they are guided through account activation
- **AND** can set password and complete profile information

#### Scenario: Account activation completion

- **WHEN** client completes activation
- **THEN** their status changes to active
- **AND** they gain full access to client dashboard features

### Requirement: Client Lifecycle Management

Company users SHALL be able to manage the complete lifecycle of client accounts including deactivation and reactivation.

#### Scenario: Deactivate client

- **WHEN** company user deactivates a client
- **THEN** client loses access to their account
- **AND** existing invoices and documents remain accessible

#### Scenario: Reactivate client

- **WHEN** company user reactivates a client
- **THEN** client regains access to their account
- **AND** receives notification of reactivation

### Requirement: Enhanced Invoice Creation

Company users SHALL be able to create invoices for any managed client, regardless of their account activation status.

#### Scenario: Invoice for invited client

- **WHEN** creating invoice for an invited client
- **THEN** system allows invoice creation
- **AND** holds delivery until client activates account

#### Scenario: Invoice delivery timing

- **WHEN** invited client activates account
- **THEN** system delivers any pending invoices
- **AND** notifies client of available documents
