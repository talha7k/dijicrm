## Context

This change addresses two related needs: persistent email configuration and professional document branding. Companies need reliable SMTP setup that survives app restarts, and their generated documents should reflect their brand identity.

Current state:

- Email service exists but SMTP config is not persisted
- Settings page has SMTP UI but no backend integration
- Document generation supports templates but no dynamic branding
- Firebase is used for data storage but not for SMTP config or branding assets

## Goals / Non-Goals

- Goals: Enable persistent SMTP config, integrate branding into PDFs, maintain security of credentials
- Non-Goals: Email template customization, advanced branding features beyond logo/stamp, third-party email providers

## Decisions

- Use Firebase Firestore for SMTP config storage with encryption for sensitive fields
- Use Firebase Storage for logo files with access control
- Load SMTP config on app initialization via a Svelte hook
- Extend existing settings page rather than creating new admin section
- Integrate branding directly into PDF generation utilities

## Risks / Trade-offs

- SMTP credentials storage: Risk of credential exposure vs convenience of persistence
  - Mitigation: Encrypt sensitive fields, use Firebase security rules
- Logo storage costs: Firebase Storage costs vs professional appearance
  - Mitigation: Reasonable file size limits, optimize images
- PDF generation complexity: Adding branding increases generation time vs professional output
  - Mitigation: Cache processed logos, lazy load branding data

## Migration Plan

1. Deploy SMTP persistence first (backward compatible)
2. Add branding fields (optional, defaults to existing behavior)
3. Update document generation to use branding when available
4. Test end-to-end functionality
5. Clean up legacy code

## Open Questions

- Should SMTP passwords be encrypted client-side before Firebase storage?
- What are the maximum logo file sizes and formats to support?
- How to handle branding for existing documents vs new ones?</content>
  </xai:function_call">

<xai:function_call name="write">
<parameter name="filePath">openspec/changes/add-smtp-persistence-and-branding/specs/email-service/spec.md
