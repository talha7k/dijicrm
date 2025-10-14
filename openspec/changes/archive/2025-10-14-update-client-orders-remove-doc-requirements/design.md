## Context

The current system has a complex document requirements feature that ties documents to products/services with conditional logic, and uses a "BusinessCase" concept that overlaps with the intended "orders" functionality. The user wants to simplify this by removing the requirements entirely, replacing BusinessCase with Orders, and implementing a straightforward document type system that supports PDF attachments for email delivery.

## Goals / Non-Goals

- Goals: Simplify document management, clarify orders vs invoices, replace BusinessCase with Orders, enable PDF attachments
- Non-Goals: Preserve existing document requirements logic, maintain BusinessCase concept, keep complex conditional document rules

## Decisions

- Decision: BusinessCase → Order (complete rename throughout system)
- Decision: Orders represent service/product requests, invoices represent billing documents
- Decision: PDF generation system isolated from document delivery
- Decision: Document types handle PDF email attachments only
- Decision: Users download PDFs manually, then attach to document types
- Decision: Email delivery tracks PDF document types sent to each client

## Architecture Separation

### PDF Generation System

- Purpose: Generate PDFs (invoices, reports, etc.)
- Output: Downloadable PDF files
- Scope: Independent, focused on generation only

### Independent Email System

- Purpose: Send emails with PDF attachments to clients
- Input: User-written messages + uploaded PDFs
- Scope: Email communication and tracking only
- Features: Multiple PDFs, message content, delivery tracking

### User Workflow

1. Generate PDF (invoice, etc.) → Download PDF
2. Compose Email → Write message → Attach PDFs → Send
3. Track complete email history (message + attachments) separately

## Client Detail Page Structure

### Simplified Tab Layout

```
Client Detail Page:
├── Overview (summary cards, recent activity)
├── Orders (main container)
│   ├── Order List
│   ├── Order Details (expandable)
│   │   ├── Invoices (within order)
│   │   └── Payments (within invoices)
│   └── New Order Creation
├── Emails (independent email system)
└── Documents (email history with attachments)
```

### Order-Centric Workflow

```
Order Management:
1. Create Order → Select Products/Services
2. Order Details → Create Invoices for Order
3. Invoice Management → Record Payments
4. Order Summary → See Total Value, Paid Amount, Balance
```

### Benefits of Order-Centric Design

- Single source of truth for client transactions
- Clear relationship between orders, invoices, and payments
- Reduced tab complexity for better UX
- Natural workflow that matches business processes

### Email Record Structure

```
Email {
  id: string
  clientId: string
  subject: string
  message: string
  attachments: EmailAttachment[] (multiple with types)
  sentAt: timestamp
  deliveryStatus: sent|delivered|bounced
  openedAt?: timestamp
  attachmentsDownloaded: boolean[]
}

EmailAttachment {
  id: string
  fileName: string
  fileUrl: string
  documentType: string // "Invoice", "Contract", "Report", etc.
  fileSize: number
  uploadedAt: timestamp
}
```

### Document Types Management

```
DocumentType {
  id: string
  name: string // "Invoice", "Contract", "Proposal", etc.
  description?: string
  companyId: string
  isActive: boolean
  createdAt: timestamp
}
```

Email {
id: string
clientId: string
subject: string
message: string
attachments: PDF[] (multiple)
sentAt: timestamp
deliveryStatus: sent|delivered|bounced
openedAt?: timestamp
attachmentsDownloaded: boolean[]
}

```

## Alternatives considered

- Keep BusinessCase and add Orders separately: Rejected as they serve the same purpose
- Keep document requirements but simplify them: Rejected as user wants complete removal
- Merge orders and invoices: Rejected as they serve different purposes
- Use file system instead of Firebase for PDFs: Rejected to maintain consistency

## Risks / Trade-offs

- Risk: BusinessCase rename may break existing data references
- Mitigation: Provide database migration script and careful testing
- Risk: Losing document requirement automation may increase manual work
- Mitigation: Provide simple document type presets and templates
- Trade-off: Simplicity over automation for document management

## Migration Plan

1. Export existing BusinessCase and document requirements data for reference
2. Create database migration: businessCases → orders
3. Rename BusinessCase interface to Order in code
4. Remove document requirements code and database references
5. Implement new document types system
6. Update UI to reflect new simplified workflow
7. Provide user guidance on new document management approach

## Open Questions

- Should we provide a migration path for existing document requirements to document types?
- What document types should be available by default?
- How to handle existing BusinessCase data during migration?
```
