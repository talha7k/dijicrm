## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Client Invoice Tab Integration

**Reason**: Invoices will be managed within the Orders tab as sub-components of orders, not as a separate tab.
**Migration**: Invoice functionality will be moved to the Orders tab with order context.

### Requirement: Client Payment History

**Reason**: Payments will be tracked within the Orders tab as part of order management, not as a separate tab.
**Migration**: Payment history will be displayed within each order's invoice details.
