import type { DocumentTemplate } from "$lib/types/document";
import { Timestamp } from "@firebase/firestore";

export const invoiceTemplate: DocumentTemplate = {
  id: "sample-order",
  companyId: "sample",
  name: "Professional Invoice Template",
  description:
    "Beautifully styled invoice template with professional layout, responsive design, and comprehensive styling",
  type: "order",
  isActive: true,
  version: 1,
  createdBy: "system",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  htmlContent: `
     <style>
        .invoice-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: white;
          color: #333;
          line-height: 1.6;
        }

         .invoice-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           margin-bottom: 40px;
           border-bottom: 3px solid #2563eb;
           padding-bottom: 30px;
           gap: 20px;
         }

         .header-left {
           display: flex;
           align-items: center;
           gap: 20px;
           flex: 0 0 auto;
         }

         .company-logo {
           flex: 0 0 auto;
         }

         .company-logo img {
           max-width: 200px;
           max-height: 100px;
           object-fit: contain;
         }

         .zatca-qr-code {
           flex: 0 0 auto;
           width: 100px;
           height: 100px;
           border: 2px solid #e5e7eb;
           border-radius: 8px;
           padding: 5px;
           background: white;
         }

         .zatca-qr-code img {
           width: 100%;
           height: 100%;
           object-fit: contain;
         }

         .invoice-title {
           flex: 1;
           text-align: center;
           margin: 0;
         }

         .invoice-title h1 {
           font-size: 36px;
           font-weight: 700;
           color: #2563eb;
           margin: 0;
           text-transform: uppercase;
           letter-spacing: 2px;
         }

         .company-info {
           flex: 0 0 auto;
           text-align: right;
           font-size: 14px;
         }

         .company-info h2 {
           font-size: 24px;
           font-weight: 600;
           color: #1f2937;
           margin: 0 0 15px 0;
         }

         .company-info p {
           margin: 5px 0;
           color: #6b7280;
         }

        .billing-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }

        .info-section {
          background: #f8fafc;
          padding: 25px;
          border-radius: 12px;
          border-left: 4px solid #2563eb;
        }

        .info-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #2563eb;
          margin: 0 0 15px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .info-section p {
          margin: 8px 0;
          font-size: 14px;
          color: #4b5563;
        }

        .order-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .order-table thead {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
        }

        .order-table th {
          padding: 20px 15px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border: none;
        }

        .order-table th:first-child {
          border-top-left-radius: 12px;
          width: 40%;
        }

        .order-table th:last-child {
          border-top-right-radius: 12px;
          text-align: right;
        }

        .order-table tbody tr {
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.2s ease;
        }

        .order-table tbody tr:hover {
          background-color: #f8fafc;
        }

        .order-table tbody tr:last-child {
          border-bottom: none;
        }

        .order-table td {
          padding: 18px 15px;
          font-size: 14px;
          color: #374151;
          border: none;
        }

        .order-table td:last-child {
          text-align: right;
          font-weight: 600;
          color: #1f2937;
        }

        .order-table tbody tr:nth-child(even) {
          background-color: #fafbfc;
        }

        .totals {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-top: 40px;
          background: #f8fafc;
          padding: 30px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          min-width: 300px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          padding: 8px 0;
          font-size: 14px;
          color: #4b5563;
        }

        .total-row.total {
          border-top: 2px solid #2563eb;
          margin-top: 15px;
          padding-top: 20px;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .total-row span:first-child {
          flex: 1;
          text-align: left;
        }

        .total-row span:last-child {
          flex: 0 0 auto;
          text-align: right;
          min-width: 100px;
        }

         .invoice-footer {
           margin-top: 50px;
           padding-top: 30px;
           border-top: 2px solid #e5e7eb;
           background: linear-gradient(to bottom, #f8fafc, white);
           padding: 40px 20px;
           border-radius: 0 0 12px 12px;
           display: flex;
           justify-content: space-between;
           align-items: flex-start;
           gap: 40px;
         }

         .footer-left {
           flex: 0 0 auto;
           text-align: center;
         }

         .company-stamp img {
           max-width: 150px;
           max-height: 150px;
           object-fit: contain;
           opacity: 0.8;
           border: 2px solid #e5e7eb;
           border-radius: 8px;
           padding: 10px;
           background: white;
         }

         .footer-right {
           flex: 1;
           text-align: left;
         }

         .invoice-footer p {
           margin: 10px 0;
           color: #6b7280;
           font-size: 14px;
         }

         .thank-you-message {
           font-size: 18px;
           font-weight: 600;
           color: #2563eb;
           margin-bottom: 20px;
         }

        @media (max-width: 768px) {
          .invoice-container {
            padding: 20px 10px;
          }

          .invoice-header {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }

          .company-info {
            text-align: center;
          }

          .billing-info {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .order-table {
            font-size: 12px;
          }

          .order-table th,
          .order-table td {
            padding: 12px 8px;
          }

          .totals {
            min-width: auto;
            width: 100%;
          }
        }

         @media print {
           .invoice-container {
             padding: 0;
             max-width: none;
             width: 8.5in;
             margin: 0 auto;
             box-shadow: none;
           }

          .zatca-qr-code {
            border: 1px solid #000;
          }

          .order-table {
            box-shadow: none;
          }

          .invoice-header {
            page-break-after: avoid;
          }

          .billing-info {
            page-break-inside: avoid;
          }

          .order-table {
            page-break-inside: avoid;
          }

           .totals {
             page-break-inside: avoid;
             min-width: 250px;
             max-width: 300px;
           }

           .invoice-footer {
             page-break-inside: avoid;
             flex-direction: column;
             text-align: center;
           }

           .footer-right {
             text-align: center;
           }
        }
      </style>

       <header class="invoice-header">
         <div class="header-left">
            <div class="company-logo">
              {{#if companyLogo}}
              <img src="{{companyLogo}}" alt="Company Logo" />
              {{/if}}
            </div>

             <div class="zatca-qr-code">
               <img src="{{zatcaQRCode}}" alt="ZATCA QR Code" />
             </div>
         </div>

         <div class="invoice-title">
           <h1>Invoice</h1>
         </div>

         <div class="company-info">
           <h2>{{companyName}}</h2>
           <p><strong>Invoice #:</strong> {{orderNumber}}</p>
           <p><strong>Date:</strong> {{orderDate}}</p>
           <p><strong>Due Date:</strong> {{dueDate}}</p>
         </div>
       </header>

      <div class="billing-info">
        <div class="info-section">
          <h3>From</h3>
          <p><strong>{{companyName}}</strong></p>
          <p>{{companyAddress}}</p>
          <p>{{companyPhone}}</p>
          <p>{{companyEmail}}</p>
        </div>

        <div class="info-section">
          <h3>Bill To</h3>
          <p><strong>{{clientName}}</strong></p>
          {{#if clientCompanyName}}
          <p>{{clientCompanyName}}</p>
          {{/if}}
          <p>{{clientAddress}}</p>
          <p>{{clientPhone}}</p>
          <p>{{clientEmail}}</p>
          {{#if clientVatNumber}}
          <p><strong>VAT:</strong> {{clientVatNumber}}</p>
          {{/if}}
        </div>
      </div>

      <table class="order-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>
              <strong>{{description}}</strong>
              {{#if description}}
              <br><small style="color: #6b7280;">Service provided</small>
              {{/if}}
            </td>
            <td style="text-align: center;">{{quantity}}</td>
            <td style="text-align: right;">{{formatCurrency rate}}</td>
            <td style="text-align: right;">{{formatCurrency (multiply quantity rate)}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>{{formatCurrency subtotal}}</span>
        </div>
        {{#if discountAmount}}
        <div class="total-row">
          <span>Discount:</span>
          <span>-{{formatCurrency discountAmount}}</span>
        </div>
        {{/if}}
        {{#if taxRate}}
        <div class="total-row">
          <span>Tax ({{taxRate}}%):</span>
          <span>{{formatCurrency taxAmount}}</span>
        </div>
        {{/if}}
        <div class="total-row total">
          <span>Total:</span>
          <span>{{formatCurrency totalAmount}}</span>
        </div>
      </div>

       <footer class="invoice-footer">
         <div class="footer-left">
            <div class="company-stamp">
              {{#if companyStamp}}
              <img src="{{companyStamp}}" alt="Company Stamp" />
              {{/if}}
            </div>
         </div>
         <div class="footer-right">
           <p class="thank-you-message">Thank you for your business!</p>
           <p><strong>Payment Terms:</strong> {{paymentTerms}}</p>
           <p><strong>Payment Status:</strong> {{paymentStatus}}</p>
         </div>
        </footer>
   `,
  placeholders: [
    // Template-specific variables that are not system variables
    // Most variables are now system variables and don't need to be defined here
  ],
  tags: ["order", "professional"],
};
