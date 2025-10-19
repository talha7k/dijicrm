import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb } from "$lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import type { UserProfile } from "$lib/types/user";
import type { Product } from "$lib/stores/products";
import type { Order, DocumentTemplate, Payment } from "$lib/types/document";
import type { StoredCompanyBranding } from "$lib/types/branding";

// Sample data generation functions

async function generateBrandingData(
  db: any,
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
    logoUrl: sampleLogoUrl,
    stampImageUrl: sampleStampUrl,
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any,
  };

  await db.collection("branding").doc(companyId).set(branding);

  return branding;
}

async function generateClientData(
  db: any,
  companyId: string,
): Promise<UserProfile[]> {
  const clients: UserProfile[] = [];
  const clientData = [
    {
      firstName: "Alice",
      lastName: "Johnson",
      email: "info@dijitize.com",
    },
    {
      firstName: "Bob",
      lastName: "Smith",
      email: "info@dijitize.com",
    },
    {
      firstName: "Carol",
      lastName: "Williams",
      email: "info@dijitize.com",
    },
  ];

  for (const data of clientData) {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const client: UserProfile = {
      uid: clientId,
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
      permissions: ["view_orders", "make_payments"],
      companyAssociations: [
        {
          companyId: companyId,
          role: "member" as const,
          joinedAt: Timestamp.now() as any,
        },
      ],
      currentCompanyId: companyId,
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
      onboardingCompleted: true,
    };

    await db.collection("users").doc(clientId).set(client);
    clients.push(client);
  }

  return clients;
}

async function generateProductData(
  db: any,
  companyId: string,
): Promise<Product[]> {
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
  db: any,
  companyId: string,
  companyUser: UserProfile,
): Promise<DocumentTemplate[]> {
  const templates: DocumentTemplate[] = [
    {
      id: `template-${Date.now()}-1`,
      companyId,
      name: "Invoice Template",
      description: "Standard order template with company branding",
      type: "order",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; position: relative;">
          <div style="text-align: center; margin-bottom: 30px;">
            {{#if companyLogo}}<img src="{{companyLogo}}" alt="Company Logo" style="max-width: 200px; max-height: 100px; margin-bottom: 10px;" />{{/if}}
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
          {{#if zatcaQRCode}}
          <div style="position: absolute; top: 20px; right: 20px;">
            <img src="{{zatcaQRCode}}" alt="ZATCA QR Code" style="width: 100px; height: 100px;" />
          </div>
          {{/if}}
          {{#if companyStamp}}
          <div style="position: absolute; bottom: 20px; right: 20px; opacity: 0.8;">
            <img src="{{companyStamp}}" alt="Company Stamp" style="max-width: 150px; max-height: 150px; transform: rotate(-15deg);" />
          </div>
          {{/if}}
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
        {
          key: "companyLogo",
          label: "Company Logo",
          type: "image",
          required: false,
        },
        {
          key: "companyStamp",
          label: "Company Stamp",
          type: "image",
          required: false,
        },
        {
          key: "zatcaQRCode",
          label: "ZATCA QR Code",
          type: "image",
          required: false,
        },
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
  db: any,
  companyId: string,
  clients: UserProfile[],
  products: Product[],
  templates: DocumentTemplate[],
  companyUser: UserProfile,
): Promise<Order[]> {
  const orders: Order[] = [];

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const product = products[i % products.length];
    const template = templates[0]; // Use first template

    const order: Order = {
      id: `order-${Date.now()}-${i}`,
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

    await db.collection("orders").doc(order.id).set(order);
    orders.push(order);
  }

  return orders;
}

async function generatePaymentData(
  db: any,
  companyId: string,
  orders: Order[],
  clients: UserProfile[],
  companyUser: UserProfile,
): Promise<Payment[]> {
  const payments: Payment[] = [];

  for (const order of orders) {
    if (order.status === "paid") {
      const client = clients.find((c) => c.uid === order.clientId);
      if (client) {
        const payment: Payment = {
          id: `payment-${Date.now()}-${payments.length}`,
          orderId: order.id,
          companyId,
          clientId: client.uid,
          amount: order.totalAmount,
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

        // Update order payments array
        await db
          .collection("orders")
          .doc(order.id)
          .update({
            payments: [payment.id],
          });
      }
    }
  }

  return payments;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    console.log("Sample data API called");

    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    // Get current user from locals (set by auth hooks)
    const user = locals.user;
    console.log("User from locals:", user);

    if (!user || !user.uid) {
      console.log("No user found in locals");
      throw error(401, "Unauthorized");
    }

    const body = await request.json().catch(() => ({}));
    const { companyId: providedCompanyId } = body;

    // Check environment - prevent production data generation
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
      throw error(
        403,
        "Sample data generation is not allowed in production environment",
      );
    }

    // Get current user's company
    let companyId: string;
    let companyUser: UserProfile | undefined;

    if (providedCompanyId) {
      // Use provided company ID
      companyId = providedCompanyId;
      console.log("Using provided company ID:", companyId);
    } else {
      // Get company from current user's profile
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists) {
        throw error(404, "User not found");
      }

      companyUser = userDoc.data() as UserProfile;
      console.log("User profile:", {
        uid: user.uid,
        currentCompanyId: companyUser.currentCompanyId,
      });

      if (!companyUser.currentCompanyId) {
        throw error(
          400,
          "User has no active company. Please complete onboarding first.",
        );
      }

      companyId = companyUser.currentCompanyId;
    }

    // Get company user for creating data
    if (!companyUser) {
      const userDoc = await db.collection("users").doc(user.uid).get();
      companyUser = userDoc.data() as UserProfile;
    }

    // Verify company exists
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      throw error(404, `Company ${companyId} not found`);
    }

    console.log(
      "Generating sample data for company:",
      companyId,
      "user:",
      user.uid,
    );

    console.log("Generating client data for company:", companyId);
    const clients = await generateClientData(db, companyId);
    console.log("Generated", clients.length, "clients");

    console.log("Generating product data...");
    const products = await generateProductData(db, companyId);

    console.log("Generating template data...");
    const templates = await generateTemplateData(db, companyId, companyUser);

    console.log("Generating order data...");
    const orders = await generateInvoiceData(
      db,
      companyId,
      clients,
      products,
      templates,
      companyUser,
    );

    console.log("Generating payment data...");
    await generatePaymentData(db, companyId, orders, clients, companyUser);

    return json({
      success: true,
      message: "Sample data generated successfully",
      data: {
        companyId,
        clientsCount: clients.length,
        productsCount: products.length,
        templatesCount: templates.length,
        ordersCount: orders.length,
      },
    });
  } catch (err) {
    console.error("Sample data generation error:", err);
    console.error(
      "Error stack:",
      err instanceof Error ? err.stack : "No stack trace",
    );

    let errorMessage = "Unknown error";
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === "string") {
      errorMessage = err;
    } else if (err && typeof err === "object") {
      errorMessage = JSON.stringify(err);
    }

    return json(
      {
        success: false,
        error: errorMessage,
        details: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
};
