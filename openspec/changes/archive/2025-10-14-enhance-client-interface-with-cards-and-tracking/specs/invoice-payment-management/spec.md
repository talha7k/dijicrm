## MODIFIED Requirements

### Requirement: Record Invoice Payments

Company users SHALL be able to record payments received against specific invoices.

#### Scenario: Record full payment

- **GIVEN** an outstanding invoice exists
- **WHEN** company user records a payment equal to the outstanding amount
- **THEN** invoice status changes to "paid"
- **AND** payment is recorded with date, amount, and method
- **AND** outstanding balance becomes zero

#### Scenario: Record partial payment

- **GIVEN** an outstanding invoice exists
- **WHEN** company user records a payment less than the outstanding amount
- **THEN** invoice status remains "partially_paid"
- **AND** payment is recorded with date, amount, and method
- **AND** outstanding balance is reduced by payment amount

#### Scenario: Record overpayment

- **GIVEN** an outstanding invoice exists
- **WHEN** company user records a payment greater than the outstanding amount
- **THEN** system warns about overpayment
- **AND** allows recording with credit balance tracking

### Requirement: Payment History Tracking

Company users SHALL be able to view complete payment history for any invoice.

#### Scenario: View payment history

- **WHEN** company user views invoice details
- **THEN** they see chronological list of all payments
- **AND** each payment shows date, amount, method, and reference
- **AND** running balance is displayed

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

### Requirement: Invoice Status Selection

Company users SHALL be able to set the initial status when creating invoices.

#### Scenario: Status selection during creation

- **WHEN** company user creates a new invoice
- **THEN** they can choose status from dropdown (draft, quote, sent, paid)
- **AND** default status is "draft"
- **AND** selected status is applied to the invoice

### Requirement: Outstanding Balance Calculation

The system SHALL maintain accurate outstanding balances for all invoices.

#### Scenario: Balance updates

- **WHEN** payment is recorded against invoice
- **THEN** outstanding balance is recalculated
- **AND** balance is displayed on invoice details
- **AND** company dashboard reflects updated totals

### Requirement: Payment Method Tracking

Company users SHALL be able to specify payment methods for recorded payments.

#### Scenario: Payment method selection

- **WHEN** recording a payment
- **THEN** user can select from predefined payment methods
- **AND** custom payment methods can be added
- **AND** payment method is stored with transaction

### Requirement: Payment Validation

The system SHALL validate payment data before recording.

#### Scenario: Payment validation

- **WHEN** recording a payment
- **THEN** amount must be positive number
- **AND** payment date cannot be in future
- **AND** payment method is required
- **AND** invoice must exist and be outstanding

## ADDED Requirements

### Requirement: Invoice Detail Page

Company users SHALL be able to access comprehensive invoice details through a dedicated invoice detail page.

#### Scenario: View invoice details

- **WHEN** company user clicks on an invoice from client detail page
- **THEN** they are navigated to `/clients/[clientId]/invoices/[invoiceId]`
- **AND** they see complete invoice information including line items, taxes, and totals
- **AND** payment history is displayed in chronological order
- **AND** outstanding balance is clearly shown

#### Scenario: Record payment from invoice detail

- **WHEN** company user clicks "Record Payment" on invoice detail page
- **THEN** a payment modal opens with invoice pre-selected
- **AND** payment amount defaults to outstanding balance
- **AND** payment is recorded and page updates to reflect new status

### Requirement: Client Invoice Tab Integration

Client detail pages SHALL provide dedicated invoice management interface integrated with overall client view.

#### Scenario: Access client invoices

- **WHEN** company user navigates to Invoices tab on client detail page
- **THEN** they see all invoices for that client with status indicators
- **AND** each invoice shows amount, due date, status, and quick actions
- **AND** clicking on any invoice navigates to invoice detail page

#### Scenario: Invoice status overview

- **WHEN** viewing client invoices tab
- **THEN** summary cards show total invoiced, paid, and outstanding amounts
- **AND** overdue invoices are highlighted with visual alerts
- **AND** quick filters allow viewing by status (all, paid, outstanding, overdue)
