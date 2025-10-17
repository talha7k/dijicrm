import type { DocumentTemplate } from "$lib/types/document";
import { Timestamp } from "@firebase/firestore";

export const invoiceTemplate: DocumentTemplate = {
  id: "sample-order",
  companyId: "sample",
  name: "Standard Invoice Template",
  description:
    "Professional order template with automatic company branding (logo and stamp)",
  type: "order",
  isActive: true,
  version: 1,
  createdBy: "system",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  htmlContent: `
    <div class="order-container" style="position: relative;">
      <header class="order-header">
        <div class="company-logo" style="text-align: center; margin-bottom: 20px;">
          <img src="{{companyLogo}}" alt="Company Logo" style="max-width: 200px; max-height: 100px;" />
        </div>

        <!-- ZATCA QR Code -->
        {{#if zatcaQRCode}}
        <div class="zatca-qr-code" style="position: absolute; top: 20px; right: 20px; width: 100px; height: 100px;">
          <img src="{{zatcaQRCode}}" alt="ZATCA QR Code" style="width: 100%; height: 100%;" />
        </div>
        {{/if}}
        <h1>Invoice</h1>
        <div class="company-info">
          <h2>{{companyName}}</h2>
          <p>Invoice #: {{orderNumber}}</p>
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

      <table class="order-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>{{description}}</td>
            <td>{{quantity}}</td>
            <td>{{formatCurrency rate}}</td>
            <td>{{formatCurrency (multiply quantity rate)}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>{{formatCurrency subtotal}}</span>
        </div>
        {{#if taxRate}}
        <div class="total-row">
          <span>Tax ({{taxRate}}%):</span>
          <span>{{formatCurrency taxAmount}}</span>
        </div>
        {{/if}}
        <div class="total-row total">
          <span>Total:</span>
          <span>{{formatCurrency total}}</span>
        </div>
      </div>

      <footer class="order-footer">
        <div class="company-stamp" style="text-align: center; margin-top: 40px;">
          <img src="{{companyStamp}}" alt="Company Stamp" style="max-width: 150px; max-height: 150px;" />
        </div>
        <p>Thank you for your business!</p>
        <p>Payment terms: {{paymentTerms}}</p>
      </footer>
    </div>
  `,
  placeholders: [
    {
      key: "companyLogo",
      label: "Company Logo URL",
      type: "image",
      required: true,
    },
    {
      key: "companyStamp",
      label: "Company Stamp URL",
      type: "image",
      required: false,
    },
    {
      key: "companyName",
      label: "Company Name",
      type: "text",
      required: true,
    },
    {
      key: "orderNumber",
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
    { key: "items", label: "Invoice Items", type: "text", required: true },
    { key: "subtotal", label: "Subtotal", type: "number", required: true },
    {
      key: "taxRate",
      label: "Tax Rate (%)",
      type: "number",
      required: false,
    },
    {
      key: "taxAmount",
      label: "Tax Amount",
      type: "number",
      required: false,
    },
    { key: "total", label: "Total Amount", type: "number", required: true },
    {
      key: "paymentTerms",
      label: "Payment Terms",
      type: "text",
      required: false,
    },
    {
      key: "zatcaQRCode",
      label: "ZATCA QR Code (Base64)",
      type: "image",
      required: false,
    },
  ],
  tags: ["order", "professional"],
};
