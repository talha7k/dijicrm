import { describe, it, expect } from "vitest";
import {
  mapClientDataToTemplate,
  getClientPlaceholderKeys,
} from "./client-data-mapping";
import type { UserProfile } from "$lib/types/user";

describe("client-data-mapping", () => {
  const mockClient: UserProfile = {
    uid: "client123",
    email: "john.doe@example.com",
    displayName: "John Doe",
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "+1234567890",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      country: "USA",
      postalCode: "12345",
    },
    companyAssociations: [
      {
        companyId: "company123",
        role: "member",
        joinedAt: {
          toDate: () => new Date("2023-01-01"),
        } as any,
      },
    ],
    createdAt: {
      toDate: () => new Date("2023-01-01"),
    } as any,
    updatedAt: {
      toDate: () => new Date("2024-01-01"),
    } as any,
    lastLoginAt: {
      toDate: () => new Date("2024-01-01"),
    } as any,
    isActive: true,
    metadata: {
      accountStatus: "active",
    },
    // Other required fields with defaults
    photoURL: null,
    username: "johndoe",
    bio: "Test bio",
    emailNotifications: true,
    pushNotifications: true,
    theme: "light",
    language: "en",
    role: "client",
    permissions: [],
    currentCompanyId: "company123",
  };

  describe("mapClientDataToTemplate", () => {
    it("should map client data to template variables", () => {
      const result = mapClientDataToTemplate(mockClient);

      expect(result.clientId).toBe("client123");
      expect(result.clientName).toBe("John Doe");
      expect(result.clientFirstName).toBe("John");
      expect(result.clientLastName).toBe("Doe");
      expect(result.clientEmail).toBe("john.doe@example.com");
      expect(result.clientPhone).toBe("+1234567890");
      expect(result.clientAddress).toBe("123 Main St, Anytown, CA, 12345, USA");
      expect(result.clientStreet).toBe("123 Main St");
      expect(result.clientCity).toBe("Anytown");
      expect(result.clientState).toBe("CA");
      expect(result.clientCountry).toBe("USA");
      expect(result.clientPostalCode).toBe("12345");
      expect(result.clientAccountStatus).toBe("active");
      expect(result.clientCreatedAt).toBe("January 1, 2023");
      expect(result.clientLastLogin).toBe("January 1, 2024");
      expect(result.clientCompanyRole).toBe("member");
      expect(result.clientJoinedAt).toBe("January 1, 2023");
      expect(result.clientBio).toBe("Test bio");
      expect(result.clientUsername).toBe("johndoe");
      expect(result.currentDate).toBe("October 16, 2025");
    });

    it("should handle missing optional fields", () => {
      const clientWithoutOptionals: UserProfile = {
        ...mockClient,
        displayName: null,
        firstName: undefined,
        lastName: undefined,
        phoneNumber: undefined,
        address: undefined,
        companyAssociations: undefined,
      };

      const result = mapClientDataToTemplate(clientWithoutOptionals);

      expect(result.clientName).toBe("");
      expect(result.clientFirstName).toBe("");
      expect(result.clientLastName).toBe("");
      expect(result.clientPhone).toBe("");
      expect(result.clientAddress).toBe("");
      expect(result.clientCompanyRole).toBe("");
    });

    it("should handle displayName fallback", () => {
      const clientWithDisplayName: UserProfile = {
        ...mockClient,
        displayName: "Custom Display Name",
        firstName: "John",
        lastName: "Doe",
      };

      const result = mapClientDataToTemplate(clientWithDisplayName);
      expect(result.clientName).toBe("Custom Display Name");
    });
  });

  describe("getClientPlaceholderKeys", () => {
    it("should return all client placeholder keys", () => {
      const keys = getClientPlaceholderKeys();

      expect(keys).toContain("clientId");
      expect(keys).toContain("clientName");
      expect(keys).toContain("clientEmail");
      expect(keys).toContain("clientAddress");
      expect(keys).toContain("currentDate");
      expect(keys.length).toBeGreaterThan(20);
    });
  });
});
