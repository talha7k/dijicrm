## 1. SMTP Persistence Implementation

- [x] 1.1 Create Firebase service for SMTP configuration storage and retrieval
- [x] 1.2 Add SMTP config schema and types to Firebase collections
- [x] 1.3 Implement email service initialization hook to load SMTP config on app startup
- [x] 1.4 Update settings page to save/load SMTP configuration from Firebase
- [x] 1.5 Add error handling for SMTP config loading failures

## 2. Branding Fields Implementation

- [x] 2.1 Add company branding schema (logo URL, stamp configuration) to Firebase
- [x] 2.2 Implement Firebase Storage integration for logo uploads
- [x] 2.3 Extend settings page with logo upload component and stamp configuration fields
- [x] 2.4 Add validation for uploaded logo files (size, format, dimensions)
- [x] 2.5 Implement branding data loading in settings page

## 3. Document Generation Integration

- [x] 3.1 Update PDF generation utilities to include company logo and stamp
- [x] 3.2 Modify invoice templates to support dynamic branding elements
- [x] 3.3 Add branding context to document generation hooks
- [x] 3.4 Update document templates to use company branding data

## 4. Testing and Validation

- [x] 4.1 Add unit tests for SMTP configuration persistence
- [x] 4.2 Add unit tests for branding data storage and retrieval
- [x] 4.3 Add integration tests for email service initialization
- [x] 4.4 Add end-to-end tests for SMTP email sending with persistence
- [x] 4.5 Add end-to-end tests for branding in generated PDFs
- [x] 4.6 Test logo upload and display in settings page
- [x] 4.7 Test stamp configuration and PDF integration

## 5. Documentation and Cleanup

- [x] 5.1 Update API documentation for new Firebase collections
- [x] 5.2 Add user documentation for SMTP configuration and branding setup
- [x] 5.3 Update component documentation with new branding features
- [x] 5.4 Clean up TODO comments and placeholder code</content>
      </xai:function_call">

<xai:function_call name="write">
<parameter name="filePath">openspec/changes/add-smtp-persistence-and-branding/design.md
