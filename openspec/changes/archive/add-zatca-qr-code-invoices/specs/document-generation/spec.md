## ADDED Requirements

### Requirement: Company Data Integration for ZATCA

The system SHALL load company name and VAT number from company settings during document generation to populate ZATCA QR code data.

#### Scenario: Load company data for QR code

- **WHEN** generating an invoice PDF
- **THEN** system retrieves company name and VAT number from company settings
- **AND** uses company name as seller name in QR code
- **AND** uses VAT number for tax identification in QR code

#### Scenario: Company data validation

- **WHEN** company settings lack required ZATCA fields
- **THEN** system prevents invoice generation with clear error message
- **AND** prompts user to configure company name and VAT number in settings

### Requirement: ZATCA QR Code Generation

The system SHALL generate and include a ZATCA-compliant QR code on all invoice PDFs, containing seller information, invoice details, and tax amounts encoded in TLV format and Base64.

#### Scenario: QR code generation for standard invoice

- **WHEN** generating an invoice PDF
- **THEN** system creates QR code with seller name, VAT number, invoice date, total amount including VAT, and VAT amount
- **AND** encodes data using ZATCA TLV format (Tag-Length-Value)
- **AND** converts to Base64 with maximum 500 characters
- **AND** positions QR code in bottom-right corner of invoice

#### Scenario: QR code validation

- **WHEN** invoice contains all required ZATCA fields
- **THEN** QR code is successfully generated and embedded
- **AND** QR code can be scanned and decoded to retrieve invoice data
- **AND** TLV structure matches ZATCA specification

#### Scenario: Missing ZATCA data handling

- **WHEN** required ZATCA fields are missing from invoice
- **THEN** system fails document generation with clear error message
- **AND** indicates which fields are required for compliance
