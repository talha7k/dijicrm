## Why

Saudi Arabia's Zakat, Tax and Customs Authority (ZATCA) requires e-invoices to include a QR code containing specific invoice data in TLV format for compliance with the Kingdom's e-invoicing regulations. This change adds mandatory QR code generation and printing on invoices to meet ZATCA Phase 2 requirements.

## What Changes

- Add company name and VAT number fields to company settings page for ZATCA compliance
- Add QR code generation utility that encodes invoice data in ZATCA-compliant TLV format
- Integrate QR code into invoice PDF templates during document generation
- Ensure QR code contains seller name (company name), VAT number, invoice date, total amount, and VAT amount as specified by ZATCA
- QR code encoded in Base64 format with maximum 500 characters

## Impact

- Affected specs: document-generation
- Affected code: Company settings page, company data types, document generation service, invoice templates, PDF rendering logic
- New dependency: QR code generation library (likely qrcode npm package)</content>
  </xai:function_call">Now, create tasks.md with ordered, verifiable work items. This should be small, concrete tasks. Since this is a new feature, break it down into implementation steps.

Based on the OpenSpec instructions, tasks.md should have ordered list of small, verifiable work items that deliver user-visible progress, include validation, and highlight dependencies.

For this, tasks could be:

1. Add QR code generation utility
2. Update invoice data structure to include ZATCA fields
3. Integrate QR code into PDF generation
4. Add tests
5. Update templates

Make it numbered and checkable.

<xai:function_call name="write">
<parameter name="filePath">openspec/changes/add-zatca-qr-code-invoices/tasks.md
