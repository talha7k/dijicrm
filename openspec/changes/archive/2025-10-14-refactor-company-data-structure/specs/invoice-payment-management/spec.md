## ADDED Requirements

### Requirement: Company-Scoped Invoice Management

All invoice operations SHALL be strictly scoped to the current company context to prevent cross-company data access.

#### Scenario: Invoice creation with company validation

- **WHEN** creating a new invoice
- **THEN** the system SHALL require a valid company context
- **AND** associate the invoice with the current company
- **AND** prevent invoice creation without company association

#### Scenario: Invoice access control

- **WHEN** accessing invoice data
- **THEN** the system SHALL validate company context on all read operations
- **AND** filter invoices by companyId for company members
- **AND** filter invoices by both companyId and clientId for clients

#### Scenario: Invoice cross-company prevention

- **WHEN** attempting to access invoices from another company
- **THEN** the system SHALL deny access with appropriate error
- **AND** log the access attempt for security monitoring
- **AND** maintain company context integrity

### Requirement: Company-Scoped Payment Management

All payment operations SHALL be strictly scoped to the current company context and ensure proper client payment isolation.

#### Scenario: Payment recording with company validation

- **WHEN** recording a payment
- **THEN** the system SHALL validate the invoice belongs to the current company
- **AND** associate the payment with the same company context
- **AND** prevent cross-company payment assignments

#### Scenario: Payment access control

- **WHEN** accessing payment data
- **THEN** the system SHALL filter payments by companyId for company members
- **AND** filter payments by both companyId and clientId for clients
- **AND** validate payment-invoice company consistency

#### Scenario: Payment visibility rules

- **WHEN** displaying payment information
- **THEN** company members SHALL see all payments for their company
- **AND** clients SHALL see only payments for their invoices
- **AND** prevent access to payment details outside company context

## MODIFIED Requirements

### Requirement: Invoice-Payment Relationship Management

The system SHALL maintain proper invoice-payment relationships within company context and ensure data consistency across all operations.

#### Scenario: Invoice payment tracking

- **WHEN** tracking payments for invoices
- **THEN** the system SHALL maintain company context throughout the payment lifecycle
- **AND** ensure all payments for an invoice belong to the same company
- **AND** validate company context on payment-invoice relationships

#### Scenario: Payment allocation validation

- **WHEN** allocating payments to invoices
- **THEN** the system SHALL validate both invoice and payment belong to the same company
- **AND** prevent cross-company payment allocations
- **AND** maintain audit trail for all payment operations

#### Scenario: Client payment visibility

- **WHEN** clients view their payment history
- **THEN** the system SHALL show only payments for their invoices within their company
- **AND** filter by both companyId and clientId
- **AND** prevent access to other clients' payment information
