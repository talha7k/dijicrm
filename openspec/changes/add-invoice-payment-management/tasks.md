## 1. Payment Data Model Enhancement

- [ ] 1.1 Create Payment interface with amount, date, method, invoice reference
- [ ] 1.2 Extend BusinessCase interface to include payment tracking fields
- [ ] 1.3 Add payment status to invoice lifecycle (sent → partially_paid → paid)
- [ ] 1.4 Create usePayments hook for payment management

## 2. Payment Recording Interface

- [ ] 2.1 Create payment recording form component
- [ ] 2.2 Add payment recording to invoice detail view
- [ ] 2.3 Implement payment method selection dropdown
- [ ] 2.4 Add payment validation (positive amounts, valid dates)

## 3. Invoice Status Management

- [ ] 3.1 Update invoice status calculation logic
- [ ] 3.2 Implement automatic status transitions on payment
- [ ] 3.3 Add outstanding balance calculations
- [ ] 3.4 Update invoice list to show payment status

## 4. Payment History and Tracking

- [ ] 4.1 Create payment history component for invoices
- [ ] 4.2 Add payment audit trail with timestamps
- [ ] 4.3 Implement payment search and filtering
- [ ] 4.4 Add payment export functionality

## 5. Company Dashboard Integration

- [ ] 5.1 Update company metrics to include payment data
- [ ] 5.2 Add payment activity to recent activity feed
- [ ] 5.3 Enhance outstanding balance calculations
- [ ] 5.4 Update payment-related dashboard widgets

## 6. Client Payment Portal (Future)

- [ ] 6.1 Design client payment history interface
- [ ] 6.2 Plan payment method integration (Stripe/PayPal)
- [ ] 6.3 Add payment receipt generation
- [ ] 6.4 Implement client payment notifications

## 7. Testing and Validation

- [ ] 7.1 Write unit tests for payment calculation logic
- [ ] 7.2 Add integration tests for payment recording workflow
- [ ] 7.3 Test invoice status transitions
- [ ] 7.4 Validate payment data integrity</content>
      </xai:function_call">Now let me create the design.md file with architectural decisions.

<xai:function_call name="write">
<parameter name="filePath">openspec/changes/add-invoice-payment-management/design.md
