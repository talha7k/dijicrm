import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { PUBLIC_FIREBASE_PROJECT_ID } from "$env/static/public";
import type { UserProfile } from "$lib/types/user";
import type { Product } from "$lib/stores/products";
import type {
  BusinessCase,
  DocumentTemplate,
  Payment,
} from "$lib/types/document";
import type { StoredCompanyBranding } from "$lib/types/branding";

// Define types that match Firestore admin SDK
type AdminTimestamp = FirebaseFirestore.Timestamp;

// Initialize Firebase Admin if not already initialized
let adminApp: any;
let db: any;
let auth: any;

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // For local development, use application default credentials
    // Run: gcloud auth application-default login
    // For production, use service account key
    const isProduction = process.env.NODE_ENV === "production";
    let credential;

    if (isProduction) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKey) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set",
        );
      }
      const serviceAccount = JSON.parse(serviceAccountKey);
      credential = cert({
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
        projectId: serviceAccount.project_id,
      });
    } else {
      credential = applicationDefault();
    }

    adminApp = initializeApp({
      credential,
      projectId: PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else {
    adminApp = getApps()[0];
  }

  db = getFirestore(adminApp);
  auth = getAuth(adminApp);
}

// Sample data generation functions
async function generateCompanyData(): Promise<{
  companyId: string;
  companyUser: UserProfile;
}> {
  const companyId = `company-${Date.now()}`;
  const email = `admin-${Date.now()}@samplecompany.com`;
  const password = `SamplePass123!`;

  // Create Firebase Auth user
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: "Sample Company Admin",
  });

  // Create company user profile
  const companyUser: UserProfile = {
    uid: userRecord.uid,
    email,
    displayName: "Sample Company Admin",
    photoURL: null,
    isActive: true,
    lastLoginAt: Timestamp.now() as any,
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any,
    firstName: "John",
    lastName: "Doe",
    username: "sampleadmin",
    bio: "Sample company administrator",
    phoneNumber: "+1-555-0123",
    emailNotifications: true,
    pushNotifications: true,
    theme: "system",
    language: "en",
    role: "company",
    permissions: ["admin", "manage_clients", "manage_invoices"],
    address: {
      street: "123 Business St",
      city: "Business City",
      state: "BC",
      country: "USA",
      postalCode: "12345",
    },
    metadata: {
      deviceInfo: {
        lastDevice: "Sample Device",
        platform: "web",
      },
      lastIPAddress: "127.0.0.1",
      accountStatus: "active",
    },
  };

  // Save to Firestore
  await db.collection("users").doc(userRecord.uid).set(companyUser);

  return { companyId, companyUser };
}

async function generateBrandingData(
  companyId: string,
): Promise<StoredCompanyBranding> {
  // Generate sample logo and stamp as data URLs for demo purposes
  const sampleLogoUrl =
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
      <rect width="200" height="100" fill="#f3f4f6"/>
      <rect x="10" y="10" width="180" height="80" fill="#3b82f6" rx="8"/>
      <text x="100" y="45" text-anchor="middle" font-size="18" fill="white" font-weight="bold">LOGO</text>
      <text x="100" y="65" text-anchor="middle" font-size="12" fill="white">Sample Company</text>
    </svg>
  `);

  const sampleStampUrl =
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
      <circle cx="75" cy="75" r="70" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
      <circle cx="75" cy="75" r="60" fill="none" stroke="#3b82f6" stroke-width="2"/>
      <text x="75" y="70" text-anchor="middle" font-size="12" fill="#374151" font-weight="bold">STAMP</text>
      <text x="75" y="85" text-anchor="middle" font-size="10" fill="#374151">APPROVED</text>
      <text x="75" y="100" text-anchor="middle" font-size="8" fill="#6b7280">Sample Company LLC</text>
      <text x="75" y="115" text-anchor="middle" font-size="6" fill="#9ca3af">${new Date().toLocaleDateString()}</text>
    </svg>
  `);

  const branding: StoredCompanyBranding = {
    companyId,
    companyName: "Sample Company LLC",
    vatNumber: "123456789012345", // Sample VAT for ZATCA
    logoUrl: sampleLogoUrl,
    stampImageUrl: sampleStampUrl,
    stampPosition: "bottom-right",
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any,
  };

  await db.collection("branding").doc(companyId).set(branding);

  return branding;
}

async function generateClientData(companyId: string): Promise<UserProfile[]> {
  const clients: UserProfile[] = [];
  const clientData = [
    {
      firstName: "Alice",
      lastName: "Johnson",
      email: `alice-${Date.now()}@sampleclient.com`,
    },
    {
      firstName: "Bob",
      lastName: "Smith",
      email: `bob-${Date.now()}@sampleclient.com`,
    },
    {
      firstName: "Carol",
      lastName: "Williams",
      email: `carol-${Date.now()}@sampleclient.com`,
    },
  ];

  for (const data of clientData) {
    const password = `ClientPass123!`;
    const userRecord = await auth.createUser({
      email: data.email,
      password,
      displayName: `${data.firstName} ${data.lastName}`,
    });

    const client: UserProfile = {
      uid: userRecord.uid,
      email: data.email,
      displayName: `${data.firstName} ${data.lastName}`,
      photoURL: null,
      isActive: true,
      lastLoginAt: Timestamp.now() as any,
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
      firstName: data.firstName,
      lastName: data.lastName,
      username: `${data.firstName.toLowerCase()}${data.lastName.toLowerCase()}`,
      bio: `Sample client ${data.firstName}`,
      phoneNumber: `+1-555-0${Math.floor(Math.random() * 900) + 100}`,
      emailNotifications: true,
      pushNotifications: false,
      theme: "light",
      language: "en",
      role: "client",
      permissions: ["view_invoices", "make_payments"],
      address: {
        street: `${Math.floor(Math.random() * 999) + 1} Client Ave`,
        city: "Client City",
        state: "CC",
        country: "USA",
        postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
      },
      metadata: {
        deviceInfo: {
          lastDevice: "Sample Device",
          platform: "web",
        },
        lastIPAddress: "127.0.0.1",
        accountStatus: "active",
      },
    };

    await db.collection("users").doc(userRecord.uid).set(client);
    clients.push(client);
  }

  return clients;
}

async function generateProductData(companyId: string): Promise<Product[]> {
  const products: Product[] = [
    {
      id: `prod-${Date.now()}-1`,
      companyId,
      name: "Web Development Service",
      description: "Custom web application development and deployment",
      category: "service",
      price: 5000,
      isActive: true,
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
    },
    {
      id: `prod-${Date.now()}-2`,
      companyId,
      name: "SEO Optimization",
      description: "Search engine optimization and marketing services",
      category: "service",
      price: 1500,
      isActive: true,
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
    },
    {
      id: `prod-${Date.now()}-3`,
      companyId,
      name: "Consulting Subscription",
      description: "Monthly business consulting services",
      category: "subscription",
      price: 2000,
      isActive: true,
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
    },
  ];

  for (const product of products) {
    await db.collection("products").doc(product.id).set(product);
  }

  return products;
}

async function generateTemplateData(
  companyId: string,
  companyUser: UserProfile,
): Promise<DocumentTemplate[]> {
  const templates: DocumentTemplate[] = [
    {
      id: `template-${Date.now()}-1`,
      companyId,
      name: "Invoice Template",
      description: "Standard invoice template with company branding",
      type: "invoice",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1>{{companyName}}</h1>
            <p>Invoice</p>
          </div>
          <div style="margin-bottom: 20px;">
            <h3>Bill To:</h3>
            <p>{{clientName}}</p>
            <p>{{clientEmail}}</p>
          </div>
          <div style="margin-bottom: 20px;">
            <p><strong>Invoice Date:</strong> {{date}}</p>
            <p><strong>Due Date:</strong> {{dueDate}}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">{{serviceDescription}}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{{amount}}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 20px; text-align: right;">
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
          key: "clientName",
          label: "Client Name",
          type: "text",
          required: true,
        },
        {
          key: "clientEmail",
          label: "Client Email",
          type: "text",
          required: true,
        },
        { key: "date", label: "Invoice Date", type: "date", required: true },
        { key: "dueDate", label: "Due Date", type: "date", required: true },
        {
          key: "serviceDescription",
          label: "Service Description",
          type: "text",
          required: true,
        },
        { key: "amount", label: "Amount", type: "currency", required: true },
      ],
      isActive: true,
      version: 1,
      createdBy: companyUser.uid,
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
    },
  ];

  for (const template of templates) {
    await db.collection("documentTemplates").doc(template.id).set(template);
  }

  return templates;
}

async function generateInvoiceData(
  companyId: string,
  clients: UserProfile[],
  products: Product[],
  templates: DocumentTemplate[],
  companyUser: UserProfile,
): Promise<BusinessCase[]> {
  const invoices: BusinessCase[] = [];

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const product = products[i % products.length];
    const template = templates[0]; // Use first template

    const invoice: BusinessCase = {
      id: `invoice-${Date.now()}-${i}`,
      companyId,
      clientId: client.uid,
      title: `Invoice for ${product.name}`,
      description: `Professional services provided to ${client.displayName}`,
      selectedProducts: [product.id],
      status: i % 2 === 0 ? "paid" : "sent",
      documents: [], // Will be populated if documents are generated
      totalAmount: product.price || 1000,
      paidAmount: i % 2 === 0 ? product.price || 1000 : 0,
      outstandingAmount: i % 2 === 0 ? 0 : product.price || 1000,
      payments: [], // Will be populated
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
      createdBy: companyUser.uid,
    };

    await db.collection("businessCases").doc(invoice.id).set(invoice);
    invoices.push(invoice);
  }

  return invoices;
}

async function generatePaymentData(
  companyId: string,
  invoices: BusinessCase[],
  clients: UserProfile[],
  companyUser: UserProfile,
): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const invoice of invoices) {
    if (invoice.status === "paid") {
      const client = clients.find((c) => c.uid === invoice.clientId);
      if (client) {
        const payment: Payment = {
          id: `payment-${Date.now()}-${payments.length}`,
          invoiceId: invoice.id,
          companyId,
          clientId: client.uid,
          amount: invoice.totalAmount,
          paymentDate: Timestamp.now() as any,
          paymentMethod: "bank_transfer",
          reference: `TXN-${Date.now()}`,
          notes: "Sample payment",
          recordedBy: companyUser.uid,
          createdAt: Timestamp.now() as any,
          updatedAt: Timestamp.now() as any,
        };

        await db.collection("payments").doc(payment.id).set(payment);
        payments.push(payment);

        // Update invoice payments array
        await db
          .collection("businessCases")
          .doc(invoice.id)
          .update({
            payments: [payment.id],
          });
      }
    }
  }

  return payments;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Initialize Firebase Admin
    initializeFirebaseAdmin();

    // Check environment - prevent production data generation
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
      throw error(
        403,
        "Sample data generation is not allowed in production environment",
      );
    }

    // Generate sample data in sequence
    console.log("Generating sample company data...");
    const { companyId, companyUser } = await generateCompanyData();

    console.log("Generating branding data...");
    await generateBrandingData(companyId);

    console.log("Generating client data...");
    const clients = await generateClientData(companyId);

    console.log("Generating product data...");
    const products = await generateProductData(companyId);

    console.log("Generating template data...");
    const templates = await generateTemplateData(companyId, companyUser);

    console.log("Generating invoice data...");
    const invoices = await generateInvoiceData(
      companyId,
      clients,
      products,
      templates,
      companyUser,
    );

    console.log("Generating payment data...");
    await generatePaymentData(companyId, invoices, clients, companyUser);

    return json({
      success: true,
      message: "Sample data generated successfully",
      data: {
        companyId,
        clientsCount: clients.length,
        productsCount: products.length,
        templatesCount: templates.length,
        invoicesCount: invoices.length,
      },
    });
  } catch (err) {
    console.error("Sample data generation error:", err);

    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    return json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
};
