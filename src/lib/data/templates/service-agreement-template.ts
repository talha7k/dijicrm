import type { DocumentTemplate } from "$lib/types/document";
import { Timestamp } from "@firebase/firestore";

export const serviceAgreementTemplate: DocumentTemplate = {
  id: "sample-contract",
  companyId: "sample",
  name: "Service Agreement Template",
  description:
    "Standard service agreement with customizable terms and conditions",
  type: "business",
  isActive: true,
  version: 1,
  createdBy: "system",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  htmlContent: `
    <div class="contract-container">
      <header class="contract-header">
        <h1>Service Agreement</h1>
        <div class="parties">
          <div class="party">
            <h3>Service Provider:</h3>
            <p>{{companyName}}</p>
            <p>{{companyAddress}}</p>
          </div>
          <div class="party">
            <h3>Client:</h3>
            <p>{{clientName}}</p>
            <p>{{clientAddress}}</p>
          </div>
        </div>
      </header>

      <div class="contract-body">
        <h2>1. Services</h2>
        <p>{{servicesDescription}}</p>

        <h2>2. Payment Terms</h2>
        <p>Total Amount: {{formatCurrency totalAmount}}</p>
        <p>Payment Schedule: {{paymentSchedule}}</p>

        <h2>3. Term</h2>
        <p>Start Date: {{startDate}}</p>
        <p>End Date: {{endDate}}</p>

        <h2>4. Signatures</h2>
        <div class="signatures">
          <div class="signature">
            <p>Service Provider: ___________________________</p>
            <p>Date: _______________</p>
          </div>
          <div class="signature">
            <p>Client: ___________________________</p>
            <p>Date: _______________</p>
          </div>
        </div>
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
      key: "companyAddress",
      label: "Company Address",
      type: "text",
      required: true,
    },
    { key: "clientName", label: "Client Name", type: "text", required: true },
    {
      key: "clientAddress",
      label: "Client Address",
      type: "text",
      required: true,
    },
    {
      key: "servicesDescription",
      label: "Services Description",
      type: "text",
      required: true,
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      type: "number",
      required: true,
    },
    {
      key: "paymentSchedule",
      label: "Payment Schedule",
      type: "text",
      required: true,
    },
    { key: "startDate", label: "Start Date", type: "date", required: true },
    { key: "endDate", label: "End Date", type: "date", required: true },
  ],
  tags: ["contract", "service-agreement"],
};
