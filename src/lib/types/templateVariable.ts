import type { Timestamp } from "@firebase/firestore";

/**
 * Represents a template variable stored for a specific client
 * Used to populate template placeholders with client-specific data
 */
export interface ClientTemplateVariable {
  id: string;
  companyId: string;
  clientId: string;
  key: string; // Variable key (e.g., "clientName", "clientEmail")
  label: string; // Human-readable label
  value: any; // The actual value (string, number, date, etc.)
  type: "text" | "number" | "date" | "currency" | "boolean" | "image";
  category: "system" | "custom"; // System variables are auto-detected, custom are user-defined
  templateIds: string[]; // Template IDs that use this variable
  isRequired: boolean; // Whether this variable is required for document generation
  description?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // User ID who created
  lastModifiedBy?: string; // User ID who last modified
}

/**
 * Template for a set of variables that can be applied to clients
 * Useful for bulk variable management and consistency
 */
export interface VariableTemplate {
  id: string;
  name: string;
  description?: string;
  category: "system" | "custom";
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  documentTemplateIds: string[];
}

/**
 * Represents a variable definition within a template
 * Used for variable detection and management
 */
export interface TemplateVariable {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "image";
  required: boolean;
  category: "system" | "custom";
  description?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  defaultValue?: string;
  usageCount: number; // How many templates use this variable
  lastUsedAt?: Timestamp;
}

/**
 * Variable classification types
 */
export type VariableClassification = "system" | "custom";

/**
 * Variable data types for type safety
 */
export type VariableValueType = string | number | boolean | Date | null;

/**
 * Query filters for client template variables
 */
export interface ClientTemplateVariableFilters {
  clientId?: string;
  templateIds?: string[];
  category?: VariableClassification;
  type?: "text" | "number" | "date" | "currency" | "boolean" | "image";
  isRequired?: boolean;
  search?: string; // Search in key or label
}

/**
 * Variable template application result
 */
export interface VariableTemplateApplication {
  success: boolean;
  appliedVariables: number;
  skippedVariables: number;
  errors: string[];
}

/**
 * Variable detection result from template analysis
 */
export interface VariableDetectionResult {
  detectedVariables: TemplateVariable[];
  existingVariables: TemplateVariable[];
  newVariables: TemplateVariable[];
  recommendations: string[];
}

/**
 * Variable catalog entry for system variables
 */
export interface VariableCatalogEntry {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "image";
  category: "system";
  description: string;
  exampleValue: any;
  isCommon: boolean; // Whether this is a commonly used variable
}

// Input types for variable template operations
export interface CreateVariableTemplateInput {
  name: string;
  description?: string;
  category: "system" | "custom";
  variables: TemplateVariable[];
  isActive?: boolean;
  createdBy: string;
  documentTemplateIds?: string[];
}

export interface UpdateVariableTemplateInput {
  name?: string;
  description?: string;
  category?: "system" | "custom";
  variables?: TemplateVariable[];
  isActive?: boolean;
  documentTemplateIds?: string[];
}

/**
 * System variable catalog - Only truly system-generated variables
 * These are variables the system can auto-populate without user input
 */
export const SYSTEM_VARIABLE_CATALOG: VariableCatalogEntry[] = [
  // Date/Time variables
  {
    key: "currentDate",
    label: "Current Date",
    type: "date",
    category: "system",
    description: "The current date when the document is generated",
    exampleValue: new Date().toISOString().split("T")[0],
    isCommon: true,
  },
  {
    key: "currentTime",
    label: "Current Time",
    type: "text",
    category: "system",
    description: "The current time when the document is generated",
    exampleValue: "14:30:00",
    isCommon: true,
  },
  {
    key: "currentDateTime",
    label: "Current Date & Time",
    type: "text",
    category: "system",
    description: "The current date and time when the document is generated",
    exampleValue: new Date().toISOString(),
    isCommon: true,
  },
  {
    key: "invoiceTimestamp",
    label: "Invoice Timestamp",
    type: "text",
    category: "system",
    description: "Timestamp for invoice generation",
    exampleValue: new Date().toISOString(),
    isCommon: false,
  },

  // Document/Order variables
  {
    key: "orderNumber",
    label: "Order Number",
    type: "text",
    category: "system",
    description: "Unique identifier for the order or document",
    exampleValue: "INV-2024-001",
    isCommon: true,
  },
  {
    key: "documentId",
    label: "Document ID",
    type: "text",
    category: "system",
    description: "Unique identifier for the generated document",
    exampleValue: "doc_123456789",
    isCommon: false,
  },
  {
    key: "documentType",
    label: "Document Type",
    type: "text",
    category: "system",
    description: "Type of document being generated (invoice, receipt, etc.)",
    exampleValue: "Invoice",
    isCommon: true,
  },

  // Financial variables
  {
    key: "subtotal",
    label: "Subtotal",
    type: "currency",
    category: "system",
    description: "Subtotal amount before taxes and discounts",
    exampleValue: 1000.0,
    isCommon: true,
  },
  {
    key: "taxAmount",
    label: "Tax Amount",
    type: "currency",
    category: "system",
    description: "Total tax amount calculated from order items",
    exampleValue: 150.0,
    isCommon: true,
  },
  {
    key: "totalAmount",
    label: "Total Amount",
    type: "currency",
    category: "system",
    description: "Total amount including taxes and discounts",
    exampleValue: 1150.0,
    isCommon: true,
  },
  {
    key: "total",
    label: "Total Amount (alias)",
    type: "currency",
    category: "system",
    description: "Alias for totalAmount for backward compatibility",
    exampleValue: 1150.0,
    isCommon: false,
  },
  {
    key: "discountAmount",
    label: "Discount Amount",
    type: "currency",
    category: "system",
    description: "Total discount amount applied to the order",
    exampleValue: 50.0,
    isCommon: false,
  },
  {
    key: "currency",
    label: "Currency",
    type: "text",
    category: "system",
    description: "Currency code for the transaction",
    exampleValue: "SAR",
    isCommon: true,
  },

  // Order-derived variables
  {
    key: "items",
    label: "Order Items",
    type: "text",
    category: "system",
    description: "List of items in the order (formatted as table or list)",
    exampleValue:
      "Item 1 - Quantity: 2 - Price: $100\nItem 2 - Quantity: 1 - Price: $50",
    isCommon: true,
  },
  {
    key: "itemCount",
    label: "Item Count",
    type: "number",
    category: "system",
    description: "Total number of items in the order",
    exampleValue: 3,
    isCommon: false,
  },
  {
    key: "orderDate",
    label: "Order Date",
    type: "date",
    category: "system",
    description: "Date when the order was created",
    exampleValue: new Date().toISOString().split("T")[0],
    isCommon: true,
  },
  {
    key: "dueDate",
    label: "Due Date",
    type: "date",
    category: "system",
    description: "Payment due date for the invoice",
    exampleValue: new Date("2025-11-15").toISOString().split("T")[0],
    isCommon: true,
  },

  // Compliance variables
  {
    key: "zatcaQRCode",
    label: "ZATCA QR Code",
    type: "image",
    category: "system",
    description: "QR code for ZATCA electronic invoicing compliance",
    exampleValue: "data:image/png;base64,...",
    isCommon: false,
  },

  // Company variables (system-provided from company DB)
  {
    key: "companyName",
    label: "Company Name",
    type: "text",
    category: "system",
    description: "Name of the company generating the document",
    exampleValue: "Your Company Name",
    isCommon: true,
  },
  {
    key: "companyEmail",
    label: "Company Email",
    type: "text",
    category: "system",
    description: "Email address of the company",
    exampleValue: "info@yourcompany.com",
    isCommon: true,
  },
  {
    key: "companyPhone",
    label: "Company Phone",
    type: "text",
    category: "system",
    description: "Phone number of the company",
    exampleValue: "+966 11 123 4567",
    isCommon: true,
  },
  {
    key: "companyAddress",
    label: "Company Address",
    type: "text",
    category: "system",
    description: "Full address of the company",
    exampleValue: "123 Business St, Riyadh, Saudi Arabia",
    isCommon: true,
  },
  {
    key: "companyLogo",
    label: "Company Logo",
    type: "image",
    category: "system",
    description: "Logo image of the company",
    exampleValue: "https://yourcompany.com/logo.png",
    isCommon: true,
  },
  {
    key: "companyStamp",
    label: "Company Stamp",
    type: "text",
    category: "system",
    description: "Official company stamp or seal",
    exampleValue: "Official Company Stamp",
    isCommon: false,
  },

  // Order-specific variables
  {
    key: "taxRate",
    label: "Tax Rate",
    type: "number",
    category: "system",
    description: "Tax rate percentage applied to the order",
    exampleValue: 15,
    isCommon: true,
  },
  {
    key: "paymentTerms",
    label: "Payment Terms",
    type: "text",
    category: "system",
    description: "Payment terms for the order",
    exampleValue: "Net 30 days",
    isCommon: true,
  },

  // Order item variables (populated from order items array)
  {
    key: "description",
    label: "Item Description",
    type: "text",
    category: "system",
    description: "Description of the order item",
    exampleValue: "Web Development Services",
    isCommon: true,
  },
  {
    key: "quantity",
    label: "Item Quantity",
    type: "number",
    category: "system",
    description: "Quantity of the order item",
    exampleValue: 1,
    isCommon: true,
  },

  // Client variables (system-provided from client DB)
  {
    key: "clientName",
    label: "Client Name",
    type: "text",
    category: "system",
    description: "Full name of the client",
    exampleValue: "John Doe",
    isCommon: true,
  },
  {
    key: "clientEmail",
    label: "Client Email",
    type: "text",
    category: "system",
    description: "Email address of the client",
    exampleValue: "john.doe@example.com",
    isCommon: true,
  },
  {
    key: "clientPhone",
    label: "Client Phone",
    type: "text",
    category: "system",
    description: "Phone number of the client",
    exampleValue: "+966 50 123 4567",
    isCommon: true,
  },
  {
    key: "clientAddress",
    label: "Client Address",
    type: "text",
    category: "system",
    description: "Full address of the client",
    exampleValue: "123 Main St, Riyadh, Saudi Arabia",
    isCommon: true,
  },
  {
    key: "clientVatNumber",
    label: "Client VAT Number",
    type: "text",
    category: "system",
    description: "VAT registration number of the client",
    exampleValue: "123456789012345",
    isCommon: false,
  },
  {
    key: "clientCompanyName",
    label: "Client Company Name",
    type: "text",
    category: "system",
    description: "Company name of the client (if applicable)",
    exampleValue: "Example Company Ltd",
    isCommon: false,
  },

  // Status variables
  {
    key: "paymentStatus",
    label: "Payment Status",
    type: "text",
    category: "system",
    description: "Current payment status of the order",
    exampleValue: "Pending",
    isCommon: true,
  },
  {
    key: "orderStatus",
    label: "Order Status",
    type: "text",
    category: "system",
    description: "Current status of the order",
    exampleValue: "Processing",
    isCommon: true,
  },
];
