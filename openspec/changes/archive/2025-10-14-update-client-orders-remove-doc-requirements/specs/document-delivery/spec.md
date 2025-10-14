## ADDED Requirements

### Requirement: Document Type Management

Company users SHALL be able to create and manage document types for categorizing PDF attachments in emails.

#### Scenario: Create document type

- **WHEN** company user creates a new document type
- **THEN** they can specify name and description
- **AND** document type is available for PDF categorization
- **AND** types can be marked active/inactive

#### Scenario: Categorize PDF attachments

- **WHEN** attaching PDFs to emails
- **THEN** user must select a document type for each PDF
- **AND** document type is stored with the attachment record
- **AND** types help organize and filter email history

### Requirement: Independent Email System with Document Types

The system SHALL provide a complete email management system that operates independently from document generation, with document type categorization for attachments.

#### Scenario: Compose email with typed attachments

- **WHEN** company user sends an email to a client
- **THEN** they can write a custom message and subject
- **AND** they can attach multiple PDF files with document types
- **AND** PDFs can be any files (including generated invoices)
- **AND** each attachment is categorized by document type
- **AND** email is stored as a complete record with typed attachments

#### Scenario: Email record management with types

- **WHEN** email is sent
- **THEN** system stores complete email record (message, attachments, document types, timestamps)
- **AND** each attachment is tracked individually with its type
- **AND** delivery status is monitored per email
- **AND** attachment download tracking is available per document type

### Requirement: Document Type Filtering and Analytics

The email system SHALL provide filtering and analytics capabilities based on document types.

#### Scenario: Filter email history by document type

- **WHEN** viewing client email history
- **THEN** user can filter by document type (Invoice, Contract, etc.)
- **AND** see all emails containing specific document types
- **AND** track which document types are sent most frequently

#### Scenario: Document type analytics

- **WHEN** reviewing email communications
- **THEN** system provides analytics on document type distribution
- **AND** shows trends in document type usage over time
- **AND** helps identify most common document types per client

## MODIFIED Requirements

### Requirement: Customer-Centric Document History Tracking

Clients and company users SHALL be able to track all documents sent to customers, including document types and attachment status, with customer-centric organization.

#### Scenario: View customer document history

- **WHEN** viewing client document history
- **THEN** each entry shows document type, sent date, and delivery status
- **AND** PDF attachments are indicated with download links
- **AND** documents can be filtered by type or status
- **AND** all documents are organized by customer, not by order

#### Scenario: Document delivery confirmation

- **WHEN** document is sent with PDF attachment
- **THEN** system confirms successful delivery to the customer
- **AND** tracks email open status and attachment downloads
- **AND** provides resend capability if needed
- **AND** delivery tracking is customer-focused
