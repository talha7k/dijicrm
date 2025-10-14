## MODIFIED Requirements

### Requirement: Quick Actions

Company users SHALL have quick access buttons for common administrative tasks.

#### Scenario: Access quick actions

- **WHEN** company user views dashboard
- **THEN** they see prominent buttons for:
  - Create new invoice
  - Add new client
  - View all invoices
  - Access billing settings

## ADDED Requirements

### Requirement: Direct Client Addition

Company users SHALL be able to add clients directly to the system without requiring email invitations, enabling immediate client management for administrative purposes.

#### Scenario: Add client directly

- **WHEN** company user clicks "Add Client" button
- **THEN** they are navigated to client addition form
- **AND** form collects client information without sending invitation email
- **AND** client is created with "active" status for internal management
- **AND** client appears in client list immediately

#### Scenario: Client added without portal access

- **WHEN** client is added directly (not invited)
- **THEN** client has no portal login credentials
- **AND** client can be associated with invoices and documents
- **AND** client status shows as "added" (not "invited")
- **AND** company can invite client later for portal access

### Requirement: Client Invitation for Existing Clients

Company users SHALL be able to send portal invitations to existing clients who were added directly, enabling them to access the client dashboard.

#### Scenario: Invite existing client

- **WHEN** company user views an existing client without portal access
- **THEN** they see an "Invite to Portal" button
- **AND** clicking button sends invitation email with registration link
- **AND** client status updates to "invited"
- **AND** client receives invitation token and expiration

#### Scenario: Client accepts invitation

- **WHEN** invited client clicks invitation link
- **THEN** they complete registration process
- **AND** client status changes from "invited" to "active"
- **AND** client can now access client dashboard

### Requirement: Client Status Distinction

The system SHALL clearly distinguish between clients who have been added directly versus those who have been invited, providing appropriate status indicators and actions.

#### Scenario: View client status indicators

- **WHEN** company user views client list
- **THEN** added clients show "Added" status
- **AND** invited clients show "Invited" status
- **AND** active clients show "Active" status
- **AND** status colors and badges provide clear visual distinction

#### Scenario: Contextual client actions

- **WHEN** company user views client details
- **THEN** added clients show "Invite to Portal" action
- **AND** invited clients show "Resend Invitation" action
- **AND** active clients show standard management actions
- **AND** actions are contextually appropriate to client status
