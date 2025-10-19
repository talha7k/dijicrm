/**
 * Variable data types for type safety
 */
export type VariableValueType = string | number | boolean | Date | null;

/**
 * Simplified system variable definition
 */
export interface SystemVariable {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "image";
  description: string;
  exampleValue: any;
  isCommon: boolean;
}

/**
 * System variable catalog - Only truly system-generated variables
 * These are variables the system can auto-populate without user input
 */
export const SYSTEM_VARIABLE_CATALOG: SystemVariable[] = [
  // Date/Time variables
  {
    key: "currentDate",
    label: "Current Date",
    type: "date",
    description: "The current date when the document is generated",
    exampleValue: new Date().toISOString().split("T")[0],
    isCommon: true,
  },
  {
    key: "currentTime",
    label: "Current Time",
    type: "text",
    description: "The current time when the document is generated",
    exampleValue: "14:30:00",
    isCommon: true,
  },
  {
    key: "currentDateTime",
    label: "Current Date & Time",
    type: "text",
    description: "The current date and time when the document is generated",
    exampleValue: new Date().toISOString(),
    isCommon: true,
  },
  {
    key: "invoiceTimestamp",
    label: "Invoice Timestamp",
    type: "text",
    description: "Timestamp for invoice generation",
    exampleValue: new Date().toISOString(),
    isCommon: false,
  },

  // Document/Order variables
  {
    key: "orderNumber",
    label: "Order Number",
    type: "text",
    description: "Unique identifier for the order or document",
    exampleValue: "INV-2024-001",
    isCommon: true,
  },
  {
    key: "documentId",
    label: "Document ID",
    type: "text",
    description: "Unique identifier for the generated document",
    exampleValue: "doc_123456789",
    isCommon: false,
  },
  {
    key: "documentType",
    label: "Document Type",
    type: "text",
    description: "Type of document being generated (invoice, receipt, etc.)",
    exampleValue: "Invoice",
    isCommon: true,
  },

  // Financial variables
  {
    key: "subtotal",
    label: "Subtotal",
    type: "currency",
    description: "Subtotal amount before taxes and discounts",
    exampleValue: 1000.0,
    isCommon: true,
  },
  {
    key: "taxAmount",
    label: "Tax Amount",
    type: "currency",
    description: "Total tax amount calculated from order items",
    exampleValue: 150.0,
    isCommon: true,
  },
  {
    key: "totalAmount",
    label: "Total Amount",
    type: "currency",
    description: "Total amount including taxes and discounts",
    exampleValue: 1150.0,
    isCommon: true,
  },
  {
    key: "total",
    label: "Total Amount (alias)",
    type: "currency",
    description: "Alias for totalAmount for backward compatibility",
    exampleValue: 1150.0,
    isCommon: false,
  },
  {
    key: "discountAmount",
    label: "Discount Amount",
    type: "currency",
    description: "Total discount amount applied to the order",
    exampleValue: 50.0,
    isCommon: false,
  },
  {
    key: "currency",
    label: "Currency",
    type: "text",
    description: "Currency code for the transaction",
    exampleValue: "SAR",
    isCommon: true,
  },

  // Order-derived variables
  {
    key: "items",
    label: "Order Items",
    type: "text",
    description: "List of items in the order (formatted as table or list)",
    exampleValue:
      "Item 1 - Quantity: 2 - Price: $100\nItem 2 - Quantity: 1 - Price: $50",
    isCommon: true,
  },
  {
    key: "itemCount",
    label: "Item Count",
    type: "number",
    description: "Total number of items in the order",
    exampleValue: 3,
    isCommon: false,
  },
  {
    key: "orderDate",
    label: "Order Date",
    type: "date",
    description: "Date when the order was created",
    exampleValue: new Date().toISOString().split("T")[0],
    isCommon: true,
  },
  {
    key: "dueDate",
    label: "Due Date",
    type: "date",
    description: "Payment due date for the invoice",
    exampleValue: new Date("2025-11-15").toISOString().split("T")[0],
    isCommon: true,
  },

  // Compliance variables
  {
    key: "zatcaQRCode",
    label: "ZATCA QR Code",
    type: "image",
    description: "QR code for ZATCA electronic invoicing compliance",
    exampleValue: "data:image/png;base64,...",
    isCommon: false,
  },

  // Company variables (system-provided from company DB)
  {
    key: "companyName",
    label: "Company Name",
    type: "text",
    description: "Name of the company generating the document",
    exampleValue: "Your Company Name",
    isCommon: true,
  },
  {
    key: "companyEmail",
    label: "Company Email",
    type: "text",
    description: "Email address of the company",
    exampleValue: "info@yourcompany.com",
    isCommon: true,
  },
  {
    key: "companyPhone",
    label: "Company Phone",
    type: "text",
    description: "Phone number of the company",
    exampleValue: "+966 11 123 4567",
    isCommon: true,
  },
  {
    key: "companyAddress",
    label: "Company Address",
    type: "text",
    description: "Full address of the company",
    exampleValue: "123 Business St, Riyadh, Saudi Arabia",
    isCommon: true,
  },
  {
    key: "companyLogo",
    label: "Company Logo",
    type: "image",
    description: "Logo image of the company",
    exampleValue: "https://yourcompany.com/logo.png",
    isCommon: true,
  },
  {
    key: "companyStamp",
    label: "Company Stamp",
    type: "text",
    description: "Official company stamp or seal",
    exampleValue: "Official Company Stamp",
    isCommon: false,
  },

  // Order-specific variables
  {
    key: "taxRate",
    label: "Tax Rate",
    type: "number",
    description: "Tax rate percentage applied to the order",
    exampleValue: 15,
    isCommon: true,
  },
  {
    key: "paymentTerms",
    label: "Payment Terms",
    type: "text",
    description: "Payment terms for the order",
    exampleValue: "Net 30 days",
    isCommon: true,
  },

  // Order item variables (populated from order items array)
  {
    key: "description",
    label: "Item Description",
    type: "text",
    description: "Description of the order item",
    exampleValue: "Web Development Services",
    isCommon: true,
  },
  {
    key: "quantity",
    label: "Item Quantity",
    type: "number",
    description: "Quantity of the order item",
    exampleValue: 1,
    isCommon: true,
  },

  // Client variables (system-provided from client DB)
  {
    key: "clientName",
    label: "Client Name",
    type: "text",
    description: "Full name of the client",
    exampleValue: "John Doe",
    isCommon: true,
  },
  {
    key: "clientEmail",
    label: "Client Email",
    type: "text",
    description: "Email address of the client",
    exampleValue: "john.doe@example.com",
    isCommon: true,
  },
  {
    key: "clientPhone",
    label: "Client Phone",
    type: "text",
    description: "Phone number of the client",
    exampleValue: "+966 50 123 4567",
    isCommon: true,
  },
  {
    key: "clientAddress",
    label: "Client Address",
    type: "text",
    description: "Full address of the client",
    exampleValue: "123 Main St, Riyadh, Saudi Arabia",
    isCommon: true,
  },
  {
    key: "clientVatNumber",
    label: "Client VAT Number",
    type: "text",
    description: "VAT registration number of the client",
    exampleValue: "123456789012345",
    isCommon: false,
  },
  {
    key: "clientCompanyName",
    label: "Client Company Name",
    type: "text",
    description: "Company name of the client (if applicable)",
    exampleValue: "Example Company Ltd",
    isCommon: false,
  },

  // Status variables
  {
    key: "paymentStatus",
    label: "Payment Status",
    type: "text",
    description: "Current payment status of the order",
    exampleValue: "Pending",
    isCommon: true,
  },
  {
    key: "orderStatus",
    label: "Order Status",
    type: "text",
    description: "Current status of the order",
    exampleValue: "Processing",
    isCommon: true,
  },
];
