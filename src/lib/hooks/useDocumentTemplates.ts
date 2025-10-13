import { writable } from "svelte/store";
import type { DocumentTemplate } from "$lib/types/document";
import { Timestamp } from "firebase/firestore";

// Mock data for document templates - replace with actual Firebase queries
const mockTemplates: DocumentTemplate[] = [
  {
    id: "template-invoice-001",
    companyId: "company-001",
    name: "Standard Invoice Template",
    description:
      "Professional invoice template with automatic company branding (logo and stamp)",
    type: "invoice",
    htmlContent: `
      <div class="invoice-container">
        <header class="invoice-header">
          <div class="company-logo" style="text-align: center; margin-bottom: 20px;">
            <!-- Company logo will be automatically injected here -->
          </div>
          <h1>Invoice</h1>
          <div class="company-info">
            <h2>{{companyName}}</h2>
            <p>Invoice #: {{invoiceNumber}}</p>
            <p>Date: {{date}}</p>
            <p>Due Date: {{dueDate}}</p>
          </div>
        </header>

        <div class="billing-info">
          <div class="bill-to">
            <h3>Bill To:</h3>
            <p>{{clientName}}</p>
            <p>{{clientEmail}}</p>
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{description}}</td>
              <td>{{quantity}}</td>
              <td>{{rate}}</td>
              <td>{{amount}}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-section">
          <p><strong>Total: {{amount}}</strong></p>
        </div>
      </div>
    `,
    placeholders: [
      {
        key: "companyName",
        label: "Company Name",
        type: "text",
        required: true,
      },
      {
        key: "invoiceNumber",
        label: "Invoice Number",
        type: "text",
        required: true,
      },
      { key: "date", label: "Invoice Date", type: "date", required: true },
      { key: "dueDate", label: "Due Date", type: "date", required: true },
      { key: "clientName", label: "Client Name", type: "text", required: true },
      {
        key: "clientEmail",
        label: "Client Email",
        type: "text",
        required: true,
      },
      {
        key: "description",
        label: "Service Description",
        type: "text",
        required: true,
      },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "rate", label: "Rate", type: "currency", required: true },
      {
        key: "amount",
        label: "Total Amount",
        type: "currency",
        required: true,
      },
      // Branding placeholders (optional - branding is auto-injected)
      {
        key: "companyLogo",
        label: "Company Logo URL",
        type: "text",
        required: false,
        defaultValue: "",
      },
      {
        key: "stampText",
        label: "Document Stamp Text",
        type: "text",
        required: false,
        defaultValue: "",
      },
    ],
    isActive: true,
    version: 1,
    createdBy: "user-001",
    createdAt: Timestamp.fromDate(new Date("2024-01-01")),
    updatedAt: Timestamp.fromDate(new Date("2024-01-01")),
    tags: ["invoice", "professional"],
  },
  {
    id: "template-power-of-attorney-001",
    companyId: "company-001",
    name: "Power of Attorney Form",
    description: "Legal power of attorney document template",
    type: "legal",
    htmlContent: `
      <div class="legal-document">
        <h1>POWER OF ATTORNEY</h1>

        <p>This Power of Attorney is made on {{date}} by:</p>

        <div class="party-info">
          <p><strong>Grantor:</strong> {{clientName}}</p>
          <p><strong>Address:</strong> {{clientAddress}}</p>
        </div>

        <p>In favor of:</p>

        <div class="party-info">
          <p><strong>Attorney:</strong> {{companyName}}</p>
          <p><strong>Address:</strong> {{companyAddress}}</p>
        </div>

        <div class="powers-section">
          <h2>Powers Granted</h2>
          <p>The Grantor hereby appoints the Attorney to act on their behalf in:</p>
          <ul>
            <li>{{powers}}</li>
          </ul>
        </div>

        <div class="signature-section">
          <p>Signature: ___________________________ Date: {{date}}</p>
          <p>{{clientName}}</p>
        </div>
      </div>
    `,
    placeholders: [
      { key: "date", label: "Document Date", type: "date", required: true },
      {
        key: "clientName",
        label: "Client Full Name",
        type: "text",
        required: true,
      },
      {
        key: "clientAddress",
        label: "Client Address",
        type: "text",
        required: true,
      },
      {
        key: "companyName",
        label: "Company Name",
        type: "text",
        required: true,
      },
      {
        key: "companyAddress",
        label: "Company Address",
        type: "text",
        required: true,
      },
      { key: "powers", label: "Powers Granted", type: "text", required: true },
    ],
    isActive: true,
    version: 1,
    createdBy: "user-001",
    createdAt: Timestamp.fromDate(new Date("2024-01-01")),
    updatedAt: Timestamp.fromDate(new Date("2024-01-01")),
    tags: ["legal", "power-of-attorney"],
  },
];

export function useDocumentTemplates() {
  // In a real app, this would query Firebase based on the current user's company ID
  return writable({
    data: mockTemplates.filter(
      (template) => template.companyId === "company-001",
    ), // Mock company ID
    loading: false,
    error: null,
  });
}

export function useDocumentTemplate(templateId: string) {
  const template = mockTemplates.find((t) => t.id === templateId);
  return writable({
    data: template || null,
    loading: false,
    error: template ? null : "Template not found",
  });
}
