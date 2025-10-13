# Document Generation Engine

## Overview

The document generation engine provides the core functionality for transforming HTML templates with placeholders into final documents (HTML or PDF). It handles placeholder replacement, data validation, and format conversion.

## Core Components

### Template Rendering Engine (`src/lib/utils/template-rendering.ts`)

#### Key Functions

**`renderTemplate(template, data)`**

- Replaces all `{{placeholderKey}}` patterns in HTML with actual data values
- Handles different data types (currency, date, boolean, etc.)
- Returns rendered HTML string

**`generatePreviewData(template)`**

- Creates sample data for all template placeholders
- Used for template preview functionality
- Provides realistic preview values based on placeholder types

**`validateTemplateData(template, data)`**

- Ensures all required placeholders have values
- Returns validation result with missing fields list
- Critical for preventing generation failures

**`validateTemplateHtml(html, placeholders)`**

- Validates HTML structure and placeholder usage
- Detects undefined or unused placeholders
- Provides warnings and errors for template quality

### Document Generation API (`src/routes/api/documents/generate/+server.ts`)

#### Endpoints

**`POST /api/documents/generate`**

- Accepts: `templateId`, `data`, `format` (html|pdf)
- Validates template data before generation
- Returns generated content in requested format
- Includes metadata (generation timestamp, file info)

#### Features

- Template validation before processing
- Support for both HTML preview and PDF generation
- Error handling with detailed messages
- Ready for Firebase Storage integration

### Document Generation Hook (`src/lib/hooks/useDocumentGeneration.ts`)

#### Methods

**`generateDocument(templateId, data, format)`**

- Calls the generation API
- Manages loading states and error handling
- Returns formatted result with metadata

**`previewDocument(templateId, data)`**

- Convenience method for HTML preview generation
- Same validation and error handling as full generation

## Data Flow

```
Template + Data → Validation → Rendering → Format Conversion → Output
     ↓           ↓          ↓           ↓              ↓
   HTML      Required?    Replace     PDF/          Result
 Template   Check All    Placeholders  HTML        Object
            Fields
```

## Placeholder System

### Supported Types

- **text**: Basic string replacement
- **number**: Numeric values
- **currency**: Formatted as USD currency
- **date**: Formatted date strings
- **boolean**: Converted to "Yes"/"No"

### Format

- Placeholders use `{{key}}` syntax
- Keys must match defined placeholder keys
- Case-sensitive matching

## PDF Generation

### Current Implementation

- Mock PDF generation (returns base64 encoded placeholder)
- Ready for Puppeteer or similar library integration
- Includes file metadata (size, checksum, page count)

### Future Integration

```typescript
// Planned Puppeteer implementation
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(renderedHtml);
const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: { top: "1in", right: "1in", bottom: "1in", left: "1in" },
});
```

## Document Versioning (`src/lib/hooks/useDocumentHistory.ts`)

### Features

- Version tracking for generated documents
- Change history and comparison
- Status tracking (generated → sent → viewed → completed)
- Metadata preservation across versions

### Version Chain

```
v1 (Original) → v2 (Updated Amount) → v3 (Added Terms)
   ↓              ↓                      ↓
Generated     Sent to Client       Client Viewed
```

## Error Handling

### Validation Errors

- Missing required placeholder data
- Invalid template structure
- Undefined placeholders in HTML

### Generation Errors

- Template not found
- Data validation failures
- PDF generation failures
- Storage upload errors

## Performance Considerations

### Caching

- Template validation results
- Generated preview HTML
- Frequently used templates

### Optimization

- Lazy PDF generation (generate on demand)
- Streaming for large documents
- Background processing for bulk operations

## Security

### Input Validation

- HTML sanitization to prevent XSS
- File upload restrictions
- Template content validation

### Access Control

- Company-scoped template access
- User permission validation
- Secure file storage with access controls

## Testing Strategy

### Unit Tests

- Template rendering with various data types
- Placeholder validation logic
- Error handling scenarios

### Integration Tests

- Full document generation pipeline
- API endpoint functionality
- PDF generation accuracy

### E2E Tests

- Complete document workflow
- Client preview and download
- Version history navigation
