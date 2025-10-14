## MODIFIED Requirements

### Requirement: Invoice Status Management

The system SHALL allow manual status setting during invoice creation and automatic status management based on payment activity.

#### Scenario: Status transitions

- **GIVEN** invoice with status "sent"
- **WHEN** first payment is recorded
- **THEN** status changes to "partially_paid" if balance remains
- **OR** status changes to "paid" if balance is zero
- **AND** overdue invoices become "paid" when fully settled

#### Scenario: Manual status setting

- **WHEN** creating a new invoice
- **THEN** user can select initial status (draft, quote, sent, etc.)
- **AND** status is saved with the invoice

## ADDED Requirements

### Requirement: Invoice Creation Status Options

Company users SHALL be able to set the initial status when creating invoices.

#### Scenario: Status selection during creation

- **WHEN** company user creates a new invoice
- **THEN** they can choose status from dropdown (draft, quote, sent, paid)
- **AND** default status is "draft"
- **AND** selected status is applied to the invoice
