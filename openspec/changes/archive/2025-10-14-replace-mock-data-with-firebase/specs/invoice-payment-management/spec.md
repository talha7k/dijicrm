## MODIFIED Requirements

### Requirement: Record Invoice Payments

Company users SHALL be able to record payments received against specific invoices, stored in Firebase.

#### Scenario: Record payment in Firebase

- **GIVEN** an outstanding invoice exists in Firebase
- **WHEN** company user records a payment
- **THEN** payment document is created in Firebase payments collection
- **AND** invoice status is updated in Firebase invoices collection
- **AND** outstanding balance is recalculated and saved

### Requirement: Payment History Tracking

Company users SHALL be able to view complete payment history for any invoice, loaded from Firebase.

#### Scenario: View payment history from Firebase

- **WHEN** company user views invoice details
- **THEN** payments are queried from Firebase payments collection
- **AND** filtered by invoiceId
- **AND** displayed in chronological order

### Requirement: Outstanding Balance Calculation

The system SHALL maintain accurate outstanding balances for all invoices, calculated from Firebase data.

#### Scenario: Balance calculation from Firebase

- **WHEN** payment is recorded in Firebase
- **THEN** outstanding balance is recalculated using Firebase data
- **AND** balance is updated in invoice document
- **AND** company dashboard reflects updated totals via listeners

## ADDED Requirements

### Requirement: Client Invoice Access with Firebase

Client users SHALL be able to view their invoices loaded from Firebase.

#### Scenario: Client views invoices from Firebase

- **WHEN** client user accesses their dashboard
- **THEN** invoices are loaded from Firebase invoices collection
- **AND** filtered by clientId matching current user
- **AND** status and payment information is displayed
