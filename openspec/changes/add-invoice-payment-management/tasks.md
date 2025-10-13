## 1. Payment Data Model Enhancement

- [x] 1.1 Create Payment interface with amount, date, method, invoice reference
- [x] 1.2 Extend BusinessCase interface to include payment tracking fields
- [x] 1.3 Add payment status to invoice lifecycle (sent → partially_paid → paid)
- [x] 1.4 Create usePayments hook for payment management

## 2. Payment Recording Interface

- [x] 2.1 Create payment recording form component
- [x] 2.2 Add payment recording to invoice detail view
- [x] 2.3 Implement payment method selection dropdown
- [x] 2.4 Add payment validation (positive amounts, valid dates)

## 3. Invoice Status Management

- [x] 3.1 Update invoice status calculation logic
- [x] 3.2 Implement automatic status transitions on payment
- [x] 3.3 Add outstanding balance calculations
- [x] 3.4 Update invoice list to show payment status

## 4. Payment History and Tracking

- [x] 4.1 Create payment history component for invoices
- [x] 4.2 Add payment audit trail with timestamps
- [x] 4.3 Implement payment search and filtering
- [x] 4.4 Add payment proof upload functionality

## 5. Company Dashboard Integration

- [x] 5.1 Update company metrics to include payment data
- [x] 5.2 Add payment activity to recent activity feed
- [x] 5.3 Enhance outstanding balance calculations
- [x] 5.4 Update payment-related dashboard widgets

## 7. Testing and Validation

- [x] 7.1 Write unit tests for payment calculation logic
- [x] 7.2 Add integration tests for payment recording workflow (unit tests added, component tests require Svelte 5 setup)
- [x] 7.3 Test invoice status transitions
- [x] 7.4 Validate payment data integrity</content>
      </xai:function_call">Now let me create the design.md file with architectural decisions.

<xai:function_call name="write">
<parameter name="filePath">openspec/changes/add-invoice-payment-management/design.md
