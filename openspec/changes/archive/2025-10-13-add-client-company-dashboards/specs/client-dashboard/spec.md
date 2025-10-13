## ADDED Requirements

### Requirement: Client Dashboard Access

Authenticated clients SHALL have access to a dedicated dashboard at `/client-dashboard` that provides a personalized view of their account and billing information.

#### Scenario: Client logs in and accesses dashboard

- **WHEN** a client user successfully authenticates
- **THEN** they are redirected to `/client-dashboard`
- **AND** the dashboard displays their personalized information

#### Scenario: Unauthorized access blocked

- **WHEN** a company user attempts to access `/client-dashboard`
- **THEN** they receive a 403 Forbidden error
- **AND** are redirected to their appropriate dashboard

### Requirement: Client Invoice Management

Clients SHALL be able to view all their invoices with status indicators, payment due dates, and download capabilities.

#### Scenario: View invoice list

- **WHEN** client accesses their dashboard
- **THEN** they see a list of all their invoices
- **AND** each invoice shows status (paid, pending, overdue), amount, and due date

#### Scenario: Download invoice

- **WHEN** client clicks download on an invoice
- **THEN** a PDF version of the invoice is generated and downloaded

### Requirement: Client Payment History

Clients SHALL be able to view their complete payment history and current account balance.

#### Scenario: View payment history

- **WHEN** client navigates to payment history section
- **THEN** they see a chronological list of all payments made
- **AND** each entry shows date, amount, invoice reference, and payment method

### Requirement: Client Account Information

Clients SHALL be able to view and update their account information including contact details and notification preferences.

#### Scenario: View account details

- **WHEN** client accesses account section
- **THEN** they see their current contact information and company details

#### Scenario: Update notification preferences

- **WHEN** client modifies notification settings
- **THEN** changes are saved and applied to future communications
