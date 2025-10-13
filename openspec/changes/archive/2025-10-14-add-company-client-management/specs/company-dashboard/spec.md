## MODIFIED Requirements

### Requirement: Quick Actions

Company users SHALL have direct access buttons for common administrative tasks including client management.

#### Scenario: Access quick actions

- **WHEN** company user views dashboard
- **THEN** they see prominent buttons for:
  - Create new invoice
  - Add new client
  - View all clients
  - View all invoices
  - Access billing settings

### Requirement: Company Overview Metrics

Company users SHALL see key business metrics including total invoices, outstanding payments, client statistics, and invitation metrics.

#### Scenario: View dashboard metrics

- **WHEN** company user accesses dashboard
- **THEN** they see cards displaying:
  - Total number of clients (active, invited, inactive)
  - Total invoices created
  - Outstanding payment amount
  - Overdue invoices count
  - Pending client invitations

### Requirement: Recent Activity Feed

Company users SHALL see a feed of recent system activities including client management events.

#### Scenario: View recent activities

- **WHEN** company user accesses dashboard
- **THEN** they see a chronological feed of recent events
- **AND** events include invoice creation, payments received, new clients added, client invitations sent
