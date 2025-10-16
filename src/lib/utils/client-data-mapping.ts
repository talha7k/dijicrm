import type { UserProfile } from "$lib/types/user";

/**
 * Maps client profile data to template placeholders for document generation
 */
export function mapClientDataToTemplate(
  client: UserProfile,
): Record<string, any> {
  const clientData: Record<string, any> = {
    // Basic client information
    clientId: client.uid,
    clientName:
      client.displayName ||
      `${client.firstName || ""} ${client.lastName || ""}`.trim(),
    clientFirstName: client.firstName || "",
    clientLastName: client.lastName || "",
    clientEmail: client.email,
    clientPhone: client.phoneNumber || "",

    // Address information
    clientAddress: formatAddress(client.address),
    clientStreet: client.address?.street || "",
    clientCity: client.address?.city || "",
    clientState: client.address?.state || "",
    clientCountry: client.address?.country || "",
    clientPostalCode: client.address?.postalCode || "",

    // Account information
    clientAccountStatus: client.metadata?.accountStatus || "",
    clientCreatedAt: formatDate(client.createdAt),
    clientLastLogin: formatDate(client.lastLoginAt),

    // Company association (if available)
    clientCompanyRole: client.companyAssociations?.[0]?.role || "",
    clientJoinedAt: client.companyAssociations?.[0]?.joinedAt
      ? formatDate(client.companyAssociations[0].joinedAt)
      : "",

    // Additional profile information
    clientBio: client.bio || "",
    clientUsername: client.username || "",

    // Current date for document generation
    currentDate: formatDate(new Date()),
    currentDateTime: new Date().toISOString(),

    // Common document fields (with defaults)
    companyName: "Your Company", // Will be overridden by actual company name
    date: formatDate(new Date()),
    dueDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
    serviceDescription: "Professional services provided",
    amount: 1000, // Default amount
  };

  return clientData;
}

/**
 * Formats address object into a readable string
 */
function formatAddress(address?: UserProfile["address"]): string {
  if (!address) return "";

  const parts = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Formats a date for template use
 */
function formatDate(date: any): string {
  if (!date) return "";

  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Gets common client placeholder keys for template validation
 */
export function getClientPlaceholderKeys(): string[] {
  return [
    "clientId",
    "clientName",
    "clientFirstName",
    "clientLastName",
    "clientEmail",
    "clientPhone",
    "clientAddress",
    "clientStreet",
    "clientCity",
    "clientState",
    "clientCountry",
    "clientPostalCode",
    "clientAccountStatus",
    "clientCreatedAt",
    "clientLastLogin",
    "clientCompanyRole",
    "clientJoinedAt",
    "clientBio",
    "clientUsername",
    "currentDate",
    "currentDateTime",
    "companyName",
    "date",
    "dueDate",
    "serviceDescription",
    "amount",
  ];
}
