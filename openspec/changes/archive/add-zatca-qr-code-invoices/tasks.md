## 1. Company Settings Enhancement

- [x] 1.1 Add company name and VAT number fields to company settings schema
- [x] 1.2 Update company settings page to include company name and VAT number inputs
- [x] 1.3 Add validation for VAT number format (Saudi VAT numbers are 15 digits)
- [x] 1.4 Update company data types to include company name and VAT number

## 2. QR Code Generation Implementation

- [x] 2.1 Install QR code generation library (qrcode package)
- [x] 2.2 Create ZATCA TLV encoding utility function in $lib/utils/zatca.ts
- [x] 2.3 Implement Base64 encoding for QR code data (max 500 chars)
- [x] 2.4 Add TypeScript types for ZATCA invoice fields

## 2. Invoice Data Integration

- [x] 2.1 Update invoice schema to include ZATCA required fields (seller name, VAT number, invoice date, total, VAT amount)
- [x] 2.2 Modify document generation hook to prepare ZATCA data from invoice
- [x] 2.3 Add validation for required ZATCA fields before generation

## 3. PDF Template Updates

- [x] 3.1 Update invoice HTML template to include QR code placeholder
- [x] 3.2 Integrate QR code generation into PDF conversion process
- [x] 3.3 Position QR code in bottom-right corner of invoice as per ZATCA guidelines
- [x] 3.4 Test QR code rendering in generated PDFs

## 4. Testing and Validation

- [x] 4.1 Write unit tests for TLV encoding function
- [x] 4.2 Add integration test for QR code in invoice generation
- [x] 4.3 Validate QR code content matches ZATCA specification
- [x] 4.4 Test with sample invoice data to ensure compliance
