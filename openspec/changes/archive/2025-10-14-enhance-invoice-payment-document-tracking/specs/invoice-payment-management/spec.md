## ADDED Requirements

### Requirement: Simple Client Payment Tracking

Company users SHALL be able to track basic payment status for each client's invoices.

#### Scenario: View client payment status

- **WHEN** viewing client details
- **THEN** user sees all invoices with payment status (paid, unpaid, partially paid)
- **AND** outstanding balance is displayed per client
- **AND** payment history is shown chronologically

#### Scenario: Record client payment

- **WHEN** recording payment for client
- **THEN** user can select invoice and enter payment amount
- **AND** payment status updates automatically
- **AND** outstanding balance is recalculated

### Requirement: Basic Invoice Status

The system SHALL maintain simple invoice status based on payments.

#### Scenario: Invoice status updates

- **WHEN** payment is recorded
- **THEN** invoice status updates to paid, partially paid, or remains unpaid
- **AND** status is visible on client detail page
- **AND** outstanding balance is calculated and displayed
