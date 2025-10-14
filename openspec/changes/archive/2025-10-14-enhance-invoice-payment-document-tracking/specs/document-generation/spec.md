## ADDED Requirements

### Requirement: Custom PDF Upload

Company users SHALL be able to upload custom PDF documents for sending to clients.

#### Scenario: PDF upload interface

- **WHEN** user needs to upload custom document
- **THEN** system provides simple file upload interface
- **AND** validates PDF format
- **AND** stores document with basic metadata (name, upload date)

#### Scenario: Document management

- **WHEN** managing uploaded documents
- **THEN** user can view list of uploaded PDFs
- **AND** delete unwanted documents
- **AND** select documents for sending to clients

### Requirement: Flexible Document Selection

The system SHALL allow users to select both custom PDFs and template documents when sending to clients.

#### Scenario: Mixed document selection

- **WHEN** preparing documents for client
- **THEN** user can select from uploaded PDFs and template documents
- **AND** preview selected documents before sending
- **AND** combine different document types in single email
