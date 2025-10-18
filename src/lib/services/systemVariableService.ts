import { getDb } from "$lib/firebase-admin";
import { SYSTEM_VARIABLE_CATALOG } from "$lib/types/templateVariable";
import type { Company } from "$lib/types/company";
import type { UserProfile } from "$lib/types/user";

/**
 * Service for automatically populating system variables from database data
 * System variables are auto-populated from existing data (clients, orders, etc.)
 * and don't require user management
 */

export interface SystemVariableContext {
  companyId: string;
  clientId?: string;
  orderId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Populates all system variables based on the provided context
 */
export async function populateSystemVariables(
  context: SystemVariableContext,
): Promise<Record<string, any>> {
  const db = getDb();
  const variables: Record<string, any> = {};

  try {
    // Populate date/time variables
    const now = new Date();
    variables.currentDate = now.toISOString().split("T")[0];
    variables.currentTime = now.toTimeString().split(" ")[0];
    variables.currentDateTime = now.toISOString();
    variables.invoiceTimestamp = now.toISOString();

    // Populate company data if companyId provided
    if (context.companyId && db) {
      const companyDoc = await db
        .collection("companies")
        .doc(context.companyId)
        .get();
      if (companyDoc.exists) {
        const companyData = companyDoc.data() as Company;

        // Company system variables
        variables.companyName = companyData.name;
        variables.companyVatNumber = companyData.vatNumber;

        // For other company variables, provide fallback values
        // These can be configured through the branding system
        variables.companyEmail = "";
        variables.companyPhone = "";
        variables.companyAddress = "";
        variables.companyLogo = "";
        variables.companyStamp = "";

        // Order-specific variables
        variables.taxRate = 15; // Default tax rate
        variables.paymentTerms = "Net 30 days"; // Default payment terms
      }
    }

    // Populate client data if clientId provided
    if (context.clientId && db) {
      const clientDoc = await db
        .collection("clients")
        .doc(context.clientId)
        .get();
      if (clientDoc.exists) {
        const clientData = clientDoc.data() as UserProfile;

        // Client system variables
        variables.clientName =
          clientData.displayName ||
          `${clientData.firstName || ""} ${clientData.lastName || ""}`.trim();
        variables.clientEmail = clientData.email;
        variables.clientPhone = clientData.phoneNumber || "";
        variables.clientAddress = clientData.address
          ? `${clientData.address.street}, ${clientData.address.city}, ${clientData.address.country}`
          : "";
        variables.clientVatNumber = ""; // Not available in UserProfile
        variables.clientCompanyName = ""; // Not available in UserProfile
      }
    }

    // Populate order data if orderId provided
    if (context.orderId && db) {
      const orderDoc = await db.collection("orders").doc(context.orderId).get();
      if (orderDoc.exists) {
        const orderData = orderDoc.data();
        if (orderData) {
          // Order system variables
          variables.orderNumber = orderData.orderNumber || orderData.id;
          variables.orderDate =
            orderData.createdAt?.toDate?.()?.toISOString().split("T")[0] ||
            variables.currentDate;
          variables.documentId = orderData.id;
          variables.documentType = orderData.type || "Invoice";

          // Financial variables
          variables.subtotal = orderData.subtotal || 0;
          variables.taxAmount = orderData.taxAmount || orderData.vatAmount || 0;
          variables.totalAmount = orderData.total || orderData.totalAmount || 0;

          // For backward compatibility, also set 'total' as an alias for 'totalAmount'
          variables.total = variables.totalAmount;

          // Calculate taxAmount if not provided but we have taxRate and subtotal
          if (!variables.taxAmount && variables.taxRate && variables.subtotal) {
            variables.taxAmount =
              (variables.subtotal * variables.taxRate) / 100;
          }
          variables.discountAmount = orderData.discountAmount || 0;
          variables.currency = orderData.currency || "SAR";

          // Status variables
          variables.paymentStatus = orderData.paymentStatus || "Pending";
          variables.orderStatus = orderData.status || "Processing";

          // Due date (30 days from order date by default)
          const orderDate = orderData.createdAt?.toDate?.() || new Date();
          const dueDate = new Date(
            orderDate.getTime() + 30 * 24 * 60 * 60 * 1000,
          );
          variables.dueDate = dueDate.toISOString().split("T")[0];

          // Items data - provide raw data and calculated values
          if (orderData.items && Array.isArray(orderData.items)) {
            variables.items = orderData.items;
            variables.itemsJson = JSON.stringify(orderData.items, null, 2);
            variables.itemsCount = orderData.items.length;
            variables.itemsSubtotal = calculateItemsSubtotal(orderData.items);
            variables.itemsTotal = calculateItemsTotal(orderData.items);
          }
        }
      }
    }

    // Merge any additional data provided
    if (context.additionalData) {
      Object.assign(variables, context.additionalData);
    }

    // Ensure all system variables from catalog have values (even if empty)
    for (const systemVar of SYSTEM_VARIABLE_CATALOG) {
      if (!(systemVar.key in variables)) {
        // Special handling for company variables that might not be in company data
        if (
          systemVar.key.startsWith("company") &&
          systemVar.key !== "companyName" &&
          systemVar.key !== "companyVatNumber"
        ) {
          variables[systemVar.key] = "";
        } else if (systemVar.key === "taxRate") {
          variables[systemVar.key] = 15;
        } else if (systemVar.key === "paymentTerms") {
          variables[systemVar.key] = "Net 30 days";
        } else if (systemVar.key === "taxAmount") {
          variables[systemVar.key] = 0;
        } else {
          variables[systemVar.key] = getDefaultValueForType(systemVar.type);
        }
      }
    }

    return variables;
  } catch (error) {
    console.error("Error populating system variables:", error);

    // Return basic system variables even if database fails
    const now = new Date();
    const fallbackVariables: Record<string, any> = {
      currentDate: now.toISOString().split("T")[0],
      currentTime: now.toTimeString().split(" ")[0],
      currentDateTime: now.toISOString(),
      invoiceTimestamp: now.toISOString(),
      // Company variables with fallback values
      companyName: "Your Company",
      companyEmail: "",
      companyPhone: "",
      companyAddress: "",
      companyLogo: "",
      companyStamp: "",
      companyVatNumber: "",
      // Order variables with fallback values
      taxRate: 15,
      paymentTerms: "Net 30 days",
      taxAmount: 0,
      total: 0,
    };

    // Add fallback values for all system variables
    for (const systemVar of SYSTEM_VARIABLE_CATALOG) {
      if (!(systemVar.key in fallbackVariables)) {
        // Special handling for company and order variables
        if (
          systemVar.key.startsWith("company") &&
          systemVar.key !== "companyName" &&
          systemVar.key !== "companyVatNumber"
        ) {
          fallbackVariables[systemVar.key] = "";
        } else if (systemVar.key === "taxRate") {
          fallbackVariables[systemVar.key] = 15;
        } else if (systemVar.key === "paymentTerms") {
          fallbackVariables[systemVar.key] = "Net 30 days";
        } else if (systemVar.key === "taxAmount") {
          fallbackVariables[systemVar.key] = 0;
        } else {
          fallbackVariables[systemVar.key] = getDefaultValueForType(
            systemVar.type,
          );
        }
      }
    }

    return fallbackVariables;
  }
}

/**
 * Calculates subtotal from items
 */
function calculateItemsSubtotal(items: any[]): number {
  if (!Array.isArray(items)) return 0;

  return items.reduce((total, item) => {
    const quantity = item.quantity || 1;
    const price = item.price || item.unitPrice || 0;
    return total + quantity * price;
  }, 0);
}

/**
 * Calculates total from items (including any item-level totals)
 */
function calculateItemsTotal(items: any[]): number {
  if (!Array.isArray(items)) return 0;

  return items.reduce((total, item) => {
    const itemTotal =
      item.total || (item.quantity || 1) * (item.price || item.unitPrice || 0);
    return total + itemTotal;
  }, 0);
}

/**
 * Gets default value for a variable type
 */
function getDefaultValueForType(type: string): any {
  switch (type) {
    case "text":
      return "";
    case "number":
      return 0;
    case "currency":
      return 0.0;
    case "date":
      return new Date().toISOString().split("T")[0];
    case "boolean":
      return false;
    case "image":
      return "";
    default:
      return "";
  }
}

/**
 * Validates that all required system variables are present
 */
export function validateSystemVariables(
  variables: Record<string, any>,
  requiredKeys?: string[],
): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check specific required keys if provided
  if (requiredKeys) {
    for (const key of requiredKeys) {
      if (
        !(key in variables) ||
        variables[key] === null ||
        variables[key] === undefined
      ) {
        missing.push(key);
      }
    }
  } else {
    // Check all common system variables
    const commonSystemVars = SYSTEM_VARIABLE_CATALOG.filter((v) => v.isCommon);
    for (const systemVar of commonSystemVars) {
      if (
        !(systemVar.key in variables) ||
        variables[systemVar.key] === null ||
        variables[systemVar.key] === undefined
      ) {
        missing.push(systemVar.key);
      }
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Gets system variable metadata for a given key
 */
export function getSystemVariableInfo(key: string) {
  return SYSTEM_VARIABLE_CATALOG.find((variable) => variable.key === key);
}

/**
 * Lists all available system variable keys
 */
export function getSystemVariableKeys(): string[] {
  return SYSTEM_VARIABLE_CATALOG.map((variable) => variable.key);
}

/**
 * Gets system variables by category/type
 */
export function getSystemVariablesByType(type: string) {
  return SYSTEM_VARIABLE_CATALOG.filter((variable) => variable.type === type);
}

/**
 * Gets common system variables (those marked as isCommon)
 */
export function getCommonSystemVariables() {
  return SYSTEM_VARIABLE_CATALOG.filter((variable) => variable.isCommon);
}
