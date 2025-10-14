## MODIFIED Requirements

### Requirement: Isolated PDF Generation

The PDF generation system SHALL operate independently from document delivery, focusing solely on creating downloadable PDF files.

#### Scenario: Generate invoice PDF

- **WHEN** company user generates an invoice PDF
- **THEN** system creates a downloadable PDF file
- **AND** PDF is not automatically sent or attached to document types
- **AND** user can save PDF locally for manual attachment

#### Scenario: Independent PDF generation

- **WHEN** generating any PDF document
- **THEN** generation system works independently
- **AND** no document delivery or email functionality is included
- **AND** focus is purely on PDF creation and download

## REMOVED Requirements

### Requirement: Document Generation Integration

**Reason**: PDF generation will be isolated from document delivery. Users manually download PDFs and attach them to document types.
**Migration**: Remove all document delivery dependencies from PDF generation system.

### Requirement: Customer-Based Document Management

**Reason**: Document generation will not track customer associations. Document types system will handle customer-specific PDF delivery.
**Migration**: Remove customer tracking from PDF generation, keep it focused on generation only.
