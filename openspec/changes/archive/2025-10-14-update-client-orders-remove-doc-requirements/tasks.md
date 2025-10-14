## 1. Replace BusinessCase with Orders

- [x] 1.1 Rename BusinessCase interface to Order in src/lib/types/document.ts
- [x] 1.2 Update all BusinessCase references to Order throughout codebase
- [x] 1.3 Update invoice creation flow to use Order instead of BusinessCase
- [x] 1.4 Update database collections from "businessCases" to "orders"
- [x] 1.5 Update sample data generation to use Order model

## 2. Remove Document Requirements Feature

- [x] 2.1 Remove documentRequirementsStore from src/lib/stores/
- [x] 2.2 Remove document requirements types from src/lib/types/document.ts
- [x] 2.3 Remove document requirements routes and components
- [x] 2.4 Update imports and references throughout codebase
- [x] 2.5 Remove document requirements logic from invoice creation flow

## 3. Update Client Detail Page Structure

- [x] 3.1 Update client detail page tabs to: Overview, Orders, Emails, Documents
- [x] 3.2 Create comprehensive Orders tab with embedded payments and invoices
- [x] 3.3 Replace mock orders with real Order data from orders store
- [x] 3.4 Design order detail view with inline invoice and payment management
- [x] 3.5 Add order creation, editing, and status management
- [x] 3.6 Remove separate Invoices and Payments tabs
- [x] 3.7 Remove hidden "products" tab functionality

## 4. Implement Independent Email System

- [x] 4.1 Create email records store and management
- [x] 4.2 Design email record structure (message, recipients, attachments, timestamps)
- [x] 4.3 Add document types management for PDF categorization
- [x] 4.4 Add PDF upload capability with document type selection
- [x] 4.5 Support multiple PDF attachments per email with types
- [x] 4.6 Track email delivery status and open tracking
- [x] 4.7 Store complete email history per client with document type filtering

## 5. Update Email Interface (Independent from Documents)

- [x] 5.1 Create EmailComposeModal for writing messages and attaching PDFs
- [x] 5.2 Add PDF attachment management with document type selection
- [x] 5.3 Implement email sending with attachment and document type tracking
- [x] 5.4 Update email history to show message content, attachments, and document types
- [x] 5.5 Add document type filtering to email history
- [x] 5.6 Remove document requirements logic from email flow
- [x] 5.7 Keep email system focused on communication and tracking only

## 6. Keep PDF Generation System Isolated

- [x] 6.1 Ensure invoice PDF generation works independently
- [x] 6.2 PDF generation provides download functionality only
- [x] 6.3 Remove email system dependencies from PDF generation
- [x] 6.4 Users manually download PDFs and attach to emails

## 7. Testing and Validation

- [ ] 7.1 Test BusinessCase to Order migration
- [ ] 7.2 Test orders tab functionality with real data
- [ ] 7.3 Test document types creation and management
- [ ] 7.4 Test independent email system with document type categorization
- [ ] 7.5 Test multiple PDF attachment upload with document type selection
- [ ] 7.6 Test email record storage (message + attachments + document types + tracking)
- [ ] 7.7 Test email history filtering by document types
- [ ] 7.8 Test PDF generation independence (download only)
- [ ] 7.9 Verify document requirements removal doesn't break existing functionality
- [ ] 7.10 Test invoice creation flow with simplified order model
- [ ] 7.11 Test user workflow: Generate PDF → Download → Compose Email → Attach PDFs with Types → Send
- [ ] 7.12 Test document type analytics and filtering capabilities
