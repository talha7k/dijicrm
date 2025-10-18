import type { Timestamp } from "@firebase/firestore";

export interface DocumentTemplate {
  id: string;
  companyId: string; // Reference to company that owns the template
  name: string;
  description?: string;
  type: "order" | "legal" | "business" | "custom";
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
  companyId: string;
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
  companyId: string;
  fileName: string;
  fileUrl: string; // Firebase Storage URL
  fileType: string;
  fileSize: number;
  uploadedAt: Timestamp;
  uploadedBy: string; // User ID
}

export interface ClientDocument {
  id: string;
  companyId: string;
  clientId: string;
  name: string;
  originalFileName: string;
  category?: string;
  description?: string;
  fileSize: number;
  fileUrl: string;
  filePath: string;
  fileType: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  type: "custom";
  status: "uploaded";
}

export interface DocumentDelivery {
  id: string;
  companyId: string;
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
  orderId: string; // Reference to Order
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

// ZATCA QR Code specific interfaces
export interface ZATCAQRCodeData {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalAmount: number;
  vatAmount: number;
}

// Standard placeholder definitions - Only system-generated variables
export const STANDARD_PLACEHOLDERS: TemplatePlaceholder[] = [
  {
    key: "currentDate",
    label: "Current Date",
    type: "date",
    required: false,
    description: "The current date when the document is generated",
  },
  {
    key: "orderNumber",
    label: "Order Number",
    type: "text",
    required: false,
    description: "Unique identifier for the order or document",
  },
  {
    key: "zatcaQRCode",
    label: "ZATCA QR Code",
    type: "image",
    required: false,
    description: "ZATCA compliant QR code for electronic invoicing",
  },
  {
    key: "invoiceTimestamp",
    label: "Invoice Timestamp",
    type: "text",
    required: false,
    description: "Timestamp for invoice generation",
  },
];
