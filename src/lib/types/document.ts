import type { Timestamp } from "@firebase/firestore";

export interface DocumentTemplate {
  id: string;
  companyId: string; // Reference to company that owns the template
  name: string;
  description?: string;
  type: "invoice" | "legal" | "business" | "custom";
  htmlContent: string; // The HTML template with placeholders
  placeholders: TemplatePlaceholder[]; // Defined placeholders in the template
  isActive: boolean;
  version: number;
  createdBy: string; // User ID who created
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[]; // For categorization and search
}

export interface TemplatePlaceholder {
  key: string; // e.g., "clientName", "amount"
  label: string; // Human readable label
  type: "text" | "number" | "date" | "currency" | "boolean" | "image";
  required: boolean;
  defaultValue?: string;
  description?: string; // Optional description for the placeholder
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface GeneratedDocument {
  id: string;
  orderId: string; // Reference to the order
  clientId: string;
  templateId: string;
  templateVersion: number;
  htmlContent: string; // Generated HTML with data filled
  pdfUrl?: string; // Firebase Storage URL for PDF
  status: "generated" | "sent" | "viewed" | "completed" | "rejected";
  data: Record<string, any>; // The data used to fill placeholders
  generatedAt: Timestamp;
  sentAt?: Timestamp;
  viewedAt?: Timestamp;
  completedAt?: Timestamp;
  submittedFiles?: DocumentFile[]; // Files submitted by client
  metadata: {
    fileSize?: number;
    pageCount?: number;
    checksum?: string;
  };
  version: number; // Document version for tracking changes
  previousVersionId?: string; // Reference to previous version
  changes?: string[]; // Description of changes from previous version
}

export interface DocumentFile {
  id: string;
  fileName: string;
  fileUrl: string; // Firebase Storage URL
  fileType: string;
  fileSize: number;
  uploadedAt: Timestamp;
  uploadedBy: string; // User ID
}

export interface DocumentDelivery {
  id: string;
  documentId: string;
  recipientEmail: string;
  status: "pending" | "sent" | "delivered" | "bounced" | "complained";
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  emailServiceId?: string; // ID from email service provider
  lastRetryAt?: Timestamp; // Timestamp of last retry attempt
}

export interface Payment {
  id: string;
  invoiceId: string; // Reference to Order/invoice
  companyId: string;
  clientId: string;
  amount: number;
  paymentDate: Timestamp;
  paymentMethod: string; // e.g., "bank_transfer", "credit_card", "check", "cash"
  reference?: string; // Check number, transaction ID, etc.
  notes?: string;
  proofFiles?: DocumentFile[]; // Payment proof documents (receipts, bank statements, etc.)
  recordedBy: string; // User ID who recorded the payment
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Order {
  id: string;
  companyId: string;
  clientId: string;
  title: string;
  description?: string;
  selectedProducts: string[]; // Product IDs
  status:
    | "draft"
    | "quote"
    | "generated"
    | "sent"
    | "partially_paid"
    | "paid"
    | "overdue";
  documents: string[]; // Generated document IDs
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  payments: string[]; // Payment IDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// Standard placeholder definitions
export const STANDARD_PLACEHOLDERS: TemplatePlaceholder[] = [
  {
    key: "clientName",
    label: "Client Name",
    type: "text",
    required: true,
    validation: { minLength: 1, maxLength: 100 },
  },
  {
    key: "clientEmail",
    label: "Client Email",
    type: "text",
    required: true,
    validation: { pattern: "^[^@]+@[^@]+\\.[^@]+$" },
  },
  {
    key: "companyName",
    label: "Company Name",
    type: "text",
    required: true,
  },
  {
    key: "amount",
    label: "Amount",
    type: "currency",
    required: false,
  },
  {
    key: "date",
    label: "Date",
    type: "date",
    required: false,
    defaultValue: "{{currentDate}}",
  },
  {
    key: "dueDate",
    label: "Due Date",
    type: "date",
    required: false,
  },
];
