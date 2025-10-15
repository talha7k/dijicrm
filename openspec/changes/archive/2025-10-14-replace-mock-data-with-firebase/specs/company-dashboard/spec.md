## MODIFIED Requirements

### Requirement: Company Overview Metrics

Company users SHALL see key business metrics including total invoices, outstanding payments, and client statistics, calculated from Firebase data.

#### Scenario: View dashboard metrics from Firebase

- **WHEN** company user accesses dashboard
- **THEN** metrics are calculated from real Firebase collections
- **AND** they see cards displaying:
  - Total number of clients (from clients collection)
  - Total invoices created (from invoices collection)
  - Outstanding payment amount (calculated from invoices and payments)
  - Overdue invoices count (from invoices with past due dates)

### Requirement: Recent Activity Feed

Company users SHALL see a feed of recent system activities and client interactions, sourced from Firebase.

#### Scenario: View recent activities from Firebase

- **WHEN** company user accesses dashboard
- **THEN** they see a chronological feed of recent events from Firebase collections
- **AND** events include invoice creation, payments received, new clients added
- **AND** activities are real-time updated via Firebase listeners

## ADDED Requirements

### Requirement: Client Management with Firebase

Company users SHALL be able to manage clients using Firebase as the data source, including creating, inviting, and updating client accounts.

#### Scenario: Load clients from Firebase

- **WHEN** company user accesses client management
- **THEN** clients are loaded from Firebase clients collection
- **AND** filtered by companyId
- **AND** real-time updates are received via listeners

#### Scenario: Create client in Firebase

- **WHEN** company user creates a new client
- **THEN** client data is saved to Firebase clients collection
- **AND** invitation email is sent if applicable
- **AND** client appears in real-time in the interface

#### Scenario: Update client in Firebase

- **WHEN** company user updates client information
- **THEN** changes are saved to Firebase
- **AND** all connected components update via listeners
