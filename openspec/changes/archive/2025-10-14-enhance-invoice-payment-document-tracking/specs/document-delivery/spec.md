## ADDED Requirements

### Requirement: Simple Document Sending Interface

Company users SHALL be able to send documents to clients with a simple, intuitive interface.

#### Scenario: Document selection and sending

- **WHEN** sending documents to client
- **THEN** user can select from custom PDFs and template documents
- **AND** user can edit email subject and message
- **AND** selected documents are attached to email
- **AND** delivery status is tracked (sent, delivered)

#### Scenario: Email composition

- **WHEN** composing email for document delivery
- **THEN** user can modify subject line and body text
- **AND** client email is pre-populated
- **AND** user can preview email before sending

### Requirement: Basic Delivery Tracking

The system SHALL provide simple delivery status tracking for sent documents.

#### Scenario: Delivery status monitoring

- **WHEN** documents are sent
- **THEN** system tracks basic delivery status (sent, delivered, failed)
- **AND** status is visible on client detail page
- **AND** delivery history is maintained per client
