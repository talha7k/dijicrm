import { getDb } from "$lib/firebase-admin";
import { SYSTEM_VARIABLE_CATALOG } from "$lib/types/templateVariable";
import type { Company } from "$lib/types/company";
import type { UserProfile } from "$lib/types/user";
import { BrandingService } from "$lib/services/brandingService";

/**
 * Service for automatically populating system variables from database data
 * System variables are auto-populated from existing data (clients, orders, etc.)
 * and don't require user management
 */

/**
 * Returns a placeholder SVG for company logo
 */
function getCompanyLogoPlaceholder(): string {
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiPkNvbXBhbnkgTG9nbzwvdGV4dD4KPC9zdmc+";
}

/**
 * Returns a placeholder SVG for company stamp
 */
function getCompanyStampPlaceholder(): string {
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiPkNvbXBhbnkgU3RhbXA8L3RleHQ+Cjwvc3ZnPg==";
}

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
        variables.companyVatNumber =
          (companyData as any).vatRegistrationNumber || companyData.vatNumber;

        // Fetch company branding data for logo and stamp
        try {
          const brandingService = new BrandingService();
          const brandingResult = await brandingService.loadBranding(
            context.companyId,
          );

          if (brandingResult.success && brandingResult.branding) {
            variables.companyLogo =
              brandingResult.branding.logoUrl || getCompanyLogoPlaceholder();
            variables.companyStamp =
              brandingResult.branding.stampImageUrl ||
              getCompanyStampPlaceholder();
            variables.primaryColor =
              brandingResult.branding.primaryColor || "#1f2937";
            variables.secondaryColor =
              brandingResult.branding.secondaryColor || "#3b82f6";
          } else {
            // Fallback to placeholder values if branding not configured
            variables.companyLogo = getCompanyLogoPlaceholder();
            variables.companyStamp = getCompanyStampPlaceholder();
            variables.primaryColor = "#1f2937";
            variables.secondaryColor = "#3b82f6";
          }

          // Always set light background color
          variables.lightBackgroundColor = "#f8fafc";
        } catch (error) {
          console.warn("Failed to fetch company branding:", error);
          variables.companyLogo = getCompanyLogoPlaceholder();
          variables.companyStamp = getCompanyStampPlaceholder();
        }

        // For other company variables, provide fallback values
        // These can be configured through the branding system
        variables.companyEmail = "";
        variables.companyPhone = "";
        variables.companyAddress = "";

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
        variables.clientFirstName = clientData.firstName || "";
        variables.clientLastName = clientData.lastName || "";
        variables.clientEmail = clientData.email;
        variables.clientPhone = clientData.phoneNumber || "";
        variables.clientAddress = clientData.address
          ? `${clientData.address.street}, ${clientData.address.city}, ${clientData.address.country}`
          : "";
        variables.clientVatNumber = ""; // Not available in UserProfile
        variables.clientCompanyName = ""; // Not available in UserProfile

        // Legal information from client's legalInfo
        if (clientData.legalInfo) {
          variables.companyRegistration =
            clientData.legalInfo.companyRegistration ||
            variables.companyRegistration;
          variables.nationality =
            clientData.legalInfo.nationality || variables.nationality;
          variables.principalCapacity =
            clientData.legalInfo.principalCapacity ||
            variables.principalCapacity;
          variables.passportNumber =
            clientData.legalInfo.passportNumber || variables.passportNumber;
          variables.passportIssueDate =
            clientData.legalInfo.passportIssueDate ||
            variables.passportIssueDate;
          variables.passportExpirationDate =
            clientData.legalInfo.passportExpirationDate ||
            variables.passportExpirationDate;
          variables.passportIssuePlace =
            clientData.legalInfo.passportIssuePlace ||
            variables.passportIssuePlace;
          variables.attorneys =
            clientData.legalInfo.attorneys || variables.attorneys;
        }
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

          // For backward compatibility, also set 'total' and 'orderAmount' as aliases for 'totalAmount'
          variables.total = variables.totalAmount;
          variables.orderAmount = variables.totalAmount;

          // Calculate taxAmount if not provided but we have taxRate and subtotal
          if (!variables.taxAmount && variables.taxRate && variables.subtotal) {
            variables.taxAmount =
              (variables.subtotal * variables.taxRate) / 100;
            // Update totalAmount to include tax
            variables.totalAmount = variables.subtotal + variables.taxAmount;
            // Also update orderAmount alias
            variables.orderAmount = variables.totalAmount;
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
        } else if (systemVar.key === "orderAmount") {
          variables[systemVar.key] = variables.totalAmount || 0;
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
      companyVatNumber: "",
      // Order variables with fallback values
      taxRate: 15,
      paymentTerms: "Net 30 days",
      taxAmount: 0,
      total: 0,
      orderAmount: 0,
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
        } else if (systemVar.key === "orderAmount") {
          fallbackVariables[systemVar.key] = fallbackVariables.totalAmount || 0;
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
