# company-dashboard Specification

## Purpose
TBD - created by archiving change add-client-company-dashboards. Update Purpose after archive.
## Requirements
### Requirement: Company Dashboard Access

Authenticated company users SHALL have access to an administrative dashboard at `/dashboard` that provides operational oversight and management tools.

#### Scenario: Company user logs in and accesses dashboard

- **WHEN** a company user successfully authenticates
- **THEN** they are redirected to `/dashboard`
- **AND** the dashboard displays company management information

#### Scenario: Client access blocked

- **WHEN** a client user attempts to access `/dashboard`
- **THEN** they receive a 403 Forbidden error
- **AND** are redirected to their client dashboard

### Requirement: Company Overview Metrics

Company users SHALL see key business metrics including total invoices, outstanding payments, and client statistics.

#### Scenario: View dashboard metrics

- **WHEN** company user accesses dashboard
- **THEN** they see cards displaying:
  - Total number of clients
  - Total invoices created
  - Outstanding payment amount
  - Overdue invoices count

### Requirement: Recent Activity Feed

Company users SHALL see a feed of recent system activities and client interactions.

#### Scenario: View recent activities

- **WHEN** company user accesses dashboard
- **THEN** they see a chronological feed of recent events
- **AND** events include invoice creation, payments received, new clients added

### Requirement: Quick Actions

Company users SHALL have quick access buttons for common administrative tasks.

#### Scenario: Access quick actions

- **WHEN** company user views dashboard
- **THEN** they see prominent buttons for:
  - Create new invoice
  - Add new client
  - View all invoices
  - Access billing settings

### Requirement: Company Settings Access

Company users SHALL have direct access to company-wide settings and configurations.

#### Scenario: Access company settings

- **WHEN** company user clicks settings
- **THEN** they are navigated to the company settings page
- **AND** can modify billing preferences, notification templates, and system configurations

