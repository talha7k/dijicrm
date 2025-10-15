import { writable, get } from "svelte/store";
import type { DocumentTemplate } from "$lib/types/document";
import {
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "$lib/firebase";
import { activeCompanyId } from "./companyContext";

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
            <img src="{{companyLogo}}" alt="Company Logo" style="max-width: 200px; max-height: 100px;" />
          </div>

          <!-- ZATCA QR Code -->
          {{#if zatcaQRCode}}
          <div class="zatca-qr-code" style="position: absolute; bottom: 20px; right: 20px; width: 100px; height: 100px;">
            <img src="data:image/png;base64,{{zatcaQRCode}}" alt="ZATCA QR Code" style="width: 100%; height: 100%;" />
          </div>
          {{/if}}
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

        <footer class="invoice-footer">
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
        type: "text",
        required: false,
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
    id: "template-contract-001",
    companyId: "company-001",
    name: "Service Agreement Template",
    description:
      "Standard service agreement with customizable terms and conditions",
    type: "business",
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
    isActive: true,
    version: 1,
    createdBy: "user-001",
    createdAt: Timestamp.fromDate(new Date("2024-01-02")),
    updatedAt: Timestamp.fromDate(new Date("2024-01-02")),
    tags: ["contract", "service-agreement"],
  },
  {
    id: "template-power-of-attorney-001",
    companyId: "company-001",
    name: "Power of Attorney Template",
    description: "Legal power of attorney document template",
    type: "legal",
    htmlContent: `
      <div class="legal-document">
        <header class="document-header">
          <h1>Power of Attorney</h1>
          <p>This Power of Attorney is made on {{date}} by:</p>
        </header>

        <div class="document-body">
          <div class="principal-info">
            <h3>Principal (Grantor):</h3>
            <p>Name: {{principalName}}</p>
            <p>Address: {{principalAddress}}</p>
          </div>

          <div class="attorney-info">
            <h3>Attorney-in-Fact:</h3>
            <p>Name: {{attorneyName}}</p>
            <p>Address: {{attorneyAddress}}</p>
          </div>

          <div class="powers-granted">
            <h3>Powers Granted:</h3>
            <p>{{powers}}</p>
          </div>

          <div class="signatures">
            <div class="signature-block">
              <p>Principal: ___________________________</p>
              <p>Date: {{date}}</p>
            </div>
            <div class="signature-block">
              <p>Attorney-in-Fact: ___________________________</p>
              <p>Date: {{date}}</p>
            </div>
          </div>
        </div>
      </div>
    `,
    placeholders: [
      { key: "date", label: "Document Date", type: "date", required: true },
      {
        key: "principalName",
        label: "Principal Name",
        type: "text",
        required: true,
      },
      {
        key: "principalAddress",
        label: "Principal Address",
        type: "text",
        required: true,
      },
      {
        key: "attorneyName",
        label: "Attorney Name",
        type: "text",
        required: true,
      },
      {
        key: "attorneyAddress",
        label: "Attorney Address",
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

interface DocumentTemplatesState {
  data: DocumentTemplate[];
  loading: boolean;
  error: string | null;
}

function createDocumentTemplatesStore() {
  const store = writable<DocumentTemplatesState>({
    data: [],
    loading: false,
    error: null,
  });

  let unsubscribe: (() => void) | null = null;

  return {
    subscribe: store.subscribe,

    loadTemplates: async () => {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          store.update((state) => ({
            ...state,
            error: "No active company",
            loading: false,
          }));
          return;
        }

        // Clean up previous listener
        if (unsubscribe) {
          unsubscribe();
        }

        // Query Firebase for templates
        const templatesQuery = query(
          collection(db, "documentTemplates"),
          where("companyId", "==", companyId),
          where("isActive", "==", true),
        );
        console.log("Setting up templates query for companyId:", companyId);

        // Set up real-time listener
        unsubscribe = onSnapshot(
          templatesQuery,
          (querySnapshot) => {
            console.log(
              "Templates query snapshot received:",
              querySnapshot.size,
              "documents",
            );
            const templates: DocumentTemplate[] = [];

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              console.log("Template document:", doc.id, data);
              templates.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              } as DocumentTemplate);
            });

            console.log(
              "Updated templates store with:",
              templates.length,
              "templates",
            );
            store.update((state) => ({
              ...state,
              data: templates,
              loading: false,
              error: null,
            }));
          },
          (error) => {
            console.error("Error loading templates:", error);
            store.update((state) => ({
              ...state,
              error: error.message,
              loading: false,
            }));
          },
        );
      } catch (error) {
        console.error("Error setting up template listener:", error);
        store.update((state) => ({
          ...state,
          error:
            error instanceof Error ? error.message : "Failed to load templates",
          loading: false,
        }));
      }
    },

    createTemplate: async (
      template: Omit<
        DocumentTemplate,
        "id" | "createdAt" | "updatedAt" | "companyId"
      >,
    ) => {
      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          throw new Error("No active company");
        }

        const newTemplateData = {
          ...template,
          companyId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(
          collection(db, "documentTemplates"),
          newTemplateData,
        );
        return docRef.id;
      } catch (error) {
        console.error("Error creating template:", error);
        throw error;
      }
    },

    updateTemplate: async (id: string, updates: Partial<DocumentTemplate>) => {
      try {
        const updateData = {
          ...updates,
          updatedAt: Timestamp.now(),
        };
        await updateDoc(doc(db, "documentTemplates", id), updateData);
      } catch (error) {
        console.error("Error updating template:", error);
        throw error;
      }
    },

    deleteTemplate: async (id: string) => {
      try {
        await updateDoc(doc(db, "documentTemplates", id), {
          isActive: false,
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error("Error deleting template:", error);
        throw error;
      }
    },
  };
}

export const documentTemplatesStore = createDocumentTemplatesStore();

export async function getDocumentTemplate(templateId: string) {
  try {
    // This would need to be implemented with Firebase query
    // For now, return a placeholder
    return {
      data: null,
      loading: false,
      error: "Not implemented yet",
    };
  } catch (error) {
    return {
      data: null,
      loading: false,
      error: "Failed to load template",
    };
  }
}
