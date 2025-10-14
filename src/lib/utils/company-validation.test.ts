import { describe, it, expect } from "vitest";
import {
  hasCompanyAccess,
  getCompanyRole,
  getActiveCompanyId,
  validateCompanyDataAccess,
} from "./company-validation";
import type { UserProfile } from "$lib/types/user";

describe("company-validation", () => {
  const mockUser: UserProfile = {
    uid: "user-1",
    email: "user@example.com",
    displayName: "Test User",
    photoURL: null,
    isActive: true,
    lastLoginAt: null as any,
    createdAt: null as any,
    updatedAt: null as any,
    firstName: "Test",
    lastName: "User",
    emailNotifications: true,
    pushNotifications: true,
    theme: "light",
    language: "en",
    role: "company",
    permissions: [],
    companyAssociations: [
      {
        companyId: "company-1",
        role: "admin",
        joinedAt: null as any,
      },
      {
        companyId: "company-2",
        role: "member",
        joinedAt: null as any,
      },
    ],
    currentCompanyId: "company-1",
    address: undefined,
    metadata: {
      accountStatus: "active",
    },
  };

  it("hasCompanyAccess returns true for associated companies", () => {
    expect(hasCompanyAccess(mockUser, "company-1")).toBe(true);
    expect(hasCompanyAccess(mockUser, "company-2")).toBe(true);
    expect(hasCompanyAccess(mockUser, "company-3")).toBe(false);
  });

  it("getCompanyRole returns correct role", () => {
    expect(getCompanyRole(mockUser, "company-1")).toBe("admin");
    expect(getCompanyRole(mockUser, "company-2")).toBe("member");
    expect(getCompanyRole(mockUser, "company-3")).toBe(null);
  });

  it("getActiveCompanyId returns currentCompanyId if set and accessible", () => {
    expect(getActiveCompanyId(mockUser)).toBe("company-1");
  });

  it("getActiveCompanyId falls back to first association if no currentCompanyId", () => {
    const userWithoutCurrent = { ...mockUser, currentCompanyId: undefined };
    expect(getActiveCompanyId(userWithoutCurrent)).toBe("company-1");
  });

  it("validateCompanyDataAccess returns true for matching company", () => {
    expect(validateCompanyDataAccess(mockUser, "company-1")).toBe(true);
    expect(validateCompanyDataAccess(mockUser, "company-2")).toBe(false);
  });
});
