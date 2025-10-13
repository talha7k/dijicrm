## Why

Companies need persistent SMTP configuration for reliable email delivery and professional branding in generated documents. Currently, SMTP settings are not saved and branding elements like company logos and stamps are not integrated into invoice/PDF generation.

## What Changes

- Add Firebase storage and retrieval for SMTP configuration settings
- Integrate email service initialization to load SMTP config from Firebase on app startup
- Extend settings page with company logo upload and stamp configuration fields
- Integrate branding elements into invoice/PDF generation
- Add end-to-end testing for SMTP email sending, configuration persistence, and branding in generated documents

## Impact

- Affected specs: email-service (new), document-generation (modified), company-dashboard (modified)
- Affected code: Email service, settings page, document generation utilities, Firebase storage integration
- New dependencies: Firebase Storage for logo uploads</content>
  </xai:function_call">

<xai:function_call name="write">
<parameter name="filePath">openspec/changes/add-smtp-persistence-and-branding/tasks.md
