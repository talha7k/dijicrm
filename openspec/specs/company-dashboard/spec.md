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

Company users SHALL see key business metrics including total invoices, outstanding payments, and client statistics, calculated from Firebase data.

#### Scenario: View dashboard metrics

- **WHEN** company user accesses dashboard
- **THEN** they see cards displaying:
  - Total number of clients
  - Total invoices created
  - Outstanding payment amount
  - Overdue invoices count

#### Scenario: View dashboard metrics from Firebase

- **WHEN** company user accesses dashboard
- **THEN** metrics are calculated from real Firebase collections
- **AND** they see cards displaying:
  - Total number of clients (from clients collection)
  - Total invoices created (from invoices collection)
  - Outstanding payment amount (calculated from invoices and payments)
  - Overdue invoices count (from invoices with past due dates)

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

Company users SHALL have direct access to company-wide settings and configurations including SMTP email settings and company branding options.

#### Scenario: Access company settings

- **WHEN** company user clicks settings
- **THEN** they are navigated to the company settings page
- **AND** can modify billing preferences, notification templates, and system configurations
- **AND** can configure SMTP email server settings
- **AND** can upload company logo and configure document branding

#### Scenario: SMTP Configuration Management

- **WHEN** a company user accesses the settings page
- **THEN** SMTP configuration fields are displayed
- **AND** current saved settings are loaded and displayed
- **AND** users can modify and save SMTP settings

#### Scenario: Company Branding Configuration

- **WHEN** a company user accesses the settings page
- **THEN** company branding fields are displayed
- **AND** users can upload a company logo
- **AND** users can configure stamp settings for documents

#### Scenario: Settings Persistence

- **WHEN** a company user saves settings changes
- **THEN** all configuration data is persisted to Firebase
- **AND** success confirmation is displayed
- **AND** settings are immediately applied where applicable

### Requirement: Logo Upload and Management

The settings page SHALL allow companies to upload and manage their logo for use in generated documents.

#### Scenario: Logo Upload

- **WHEN** a company user selects a logo file
- **THEN** the file is validated for size and format
- **AND** uploaded to Firebase Storage
- **AND** the logo URL is saved to company settings

#### Scenario: Logo Display and Replacement

- **WHEN** a company has an uploaded logo
- **THEN** the logo is displayed in the settings page
- **AND** users can replace the existing logo
- **AND** old logos are cleaned up from storage

### Requirement: Stamp Configuration

The settings page SHALL allow companies to configure stamp settings for document branding.

#### Scenario: Stamp Settings Configuration

- **WHEN** a company user accesses stamp settings
- **THEN** fields for stamp text and positioning are available
- **AND** users can save stamp configuration
- **AND** settings are validated before saving

#### Scenario: Stamp Preview

- **WHEN** a company user configures stamp settings
- **THEN** a preview of the stamp appearance is shown
- **AND** users can adjust settings based on the preview

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
