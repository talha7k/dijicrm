# client-dashboard Specification

## Purpose

TBD - created by archiving change add-client-company-dashboards. Update Purpose after archive.

## Requirements

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

### Requirement: Client Invoice Tab Integration

**Note**: This requirement has been replaced by the Orders-based approach where invoices are managed within orders.

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

### Requirement: Client Card Interface

Company users SHALL see clients displayed as interactive cards rather than table rows, providing better visual hierarchy and quick access to client details.

#### Scenario: View client cards

- **WHEN** company user navigates to `/clients`
- **THEN** clients are displayed as responsive cards in a grid layout
- **AND** each card shows client name, email, status, last login, and invoice count
- **AND** cards include visual indicators for client status and activity level

#### Scenario: Navigate to client details

- **WHEN** company user clicks on any client card
- **THEN** they are navigated to the client detail page at `/clients/[id]`
- **AND** the transition is smooth and provides clear navigation feedback

### Requirement: Simplified Client Detail Tabs

Client detail pages SHALL provide a streamlined tabbed interface with orders as the main transaction container.

#### Scenario: Navigate simplified client tabs

- **WHEN** company user views client detail page
- **THEN** they see tabs for Overview, Orders, Emails, and Documents
- **AND** each tab provides focused information and actions relevant to that category
- **AND** tab switching is responsive and maintains state
- **AND** invoices and payments are accessed within the Orders tab

#### Scenario: Quick client insights

- **WHEN** company user views the Overview tab
- **THEN** they see key client metrics, recent activity, and quick action buttons
- **AND** information is presented in digestible card format
- **AND** critical alerts (overdue invoices, failed deliveries) are prominently displayed
- **AND** recent orders, emails, and documents are shown in separate cards

### Requirement: Comprehensive Client Orders Management

Company users SHALL be able to view and manage client orders as the main container, with invoices and payments as sub-components within each order.

#### Scenario: View client orders with embedded details

- **WHEN** company user navigates to Orders tab on client detail page
- **THEN** they see all orders for that client with expandable details
- **AND** each order shows product/service name, amount, status, and creation date
- **AND** orders can be expanded to show related invoices and payments
- **AND** orders can be filtered by status (pending, in_progress, completed, cancelled)

#### Scenario: Create new client order

- **WHEN** company user clicks "New Order" on client detail page
- **THEN** an order creation modal opens with client pre-selected
- **AND** user can select product/service, quantity, and initial status
- **AND** order is saved and appears in the orders list
- **AND** user can immediately create invoices for the new order

#### Scenario: Manage invoices within orders

- **WHEN** viewing an order's details
- **THEN** user can create, view, and manage invoices for that specific order
- **AND** invoice status and payment tracking are shown within the order context
- **AND** multiple invoices can be created per order

#### Scenario: Track payments within orders

- **WHEN** viewing an order's details
- **THEN** all payments for that order's invoices are displayed
- **AND** payment history is organized by invoice within the order
- **AND** outstanding balances are calculated at order level

#### Scenario: Update order status

- **WHEN** company user changes order status via dropdown
- **THEN** order status is immediately updated
- **AND** change is reflected in the UI without page refresh
- **AND** status change is logged for audit purposes
