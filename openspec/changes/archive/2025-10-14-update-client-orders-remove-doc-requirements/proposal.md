## Why

The user wants to clarify the relationship between orders and invoices on the client detail page, remove the document requirements feature entirely, and replace it with a simpler document type system that supports email attachments with PDF uploads. The current system has a "BusinessCase" concept that overlaps with the new "orders" functionality.

## What Changes

- Replace BusinessCase concept with Orders throughout the system
- Add comprehensive Orders tab to client detail page with embedded payments and invoices
- Clarify that orders are the main container (service requests) with invoices/payments as sub-components
- Remove document requirements feature completely
- Implement independent email system with PDF attachments
- Keep PDF generation isolated (users download PDFs, then manually attach to emails)
- Store complete email records with message, attachments, and delivery tracking
- Support multiple PDF attachments per email with document type categorization
- Track document types in email history for filtering and analytics
- Separate email system from document generation completely
- Simplify client detail page tabs: Overview, Orders, Emails, Documents

## Impact

- Affected specs: client-dashboard, document-requirements, document-delivery, document-generation
- Affected code: client detail page, BusinessCase types, document requirements store, document delivery components, invoice creation
- **BREAKING**: BusinessCase will be renamed to Order, document requirements feature will be completely removed
