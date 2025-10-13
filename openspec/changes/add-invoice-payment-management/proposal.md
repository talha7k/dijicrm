## Why

Companies need the ability to record and track payments against invoices to maintain accurate financial records and client relationships. Currently, the system can create and send invoices, but there's no way to record when payments are received, update invoice status accordingly, or maintain payment history. This creates gaps in financial tracking and makes it difficult to manage outstanding balances and overdue accounts.

## What Changes

- **Payment Recording**: Company users can record payments against specific invoices
- **Invoice Status Updates**: Automatic status updates when invoices are fully or partially paid
- **Payment History**: Complete audit trail of all payments with amounts, dates, and methods
- **Outstanding Balance Tracking**: Real-time calculation of remaining balances on invoices
- **Payment Method Tracking**: Record payment methods used for each transaction
- **Client Payment Portal**: Clients can view payment history and make payments (future integration)

## Impact

- Affected specs: invoice-payment-management (new capability), company-dashboard (enhanced metrics)
- Affected code: New payment management interfaces, enhanced invoice data models, payment tracking logic
- New dependencies: Payment processing integration (Stripe/PayPal), enhanced financial reporting
- Security considerations: PCI compliance for payment data handling</content>
  </xai:function_call">Now let me create the design.md file. This involves architectural decisions about data models and payment integration.

<xai:function_call name="write">
<parameter name="filePath">openspec/changes/add-invoice-payment-management/design.md
