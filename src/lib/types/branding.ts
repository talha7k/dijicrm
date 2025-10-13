import type { Timestamp } from "firebase/firestore";

// Company Branding Configuration
export interface CompanyBranding {
  logoUrl?: string; // URL to logo stored in Firebase Storage
  stampText?: string; // Text to display on document stamps
  stampPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  stampFontSize?: number; // Font size in points
  stampColor?: string; // Hex color code
  primaryColor?: string; // Brand primary color
  secondaryColor?: string; // Brand secondary color
}

// Stored Branding Configuration (with Firebase metadata)
export interface StoredCompanyBranding extends CompanyBranding {
  companyId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Branding Service response types
export interface BrandingServiceResult {
  success: boolean;
  error?: string;
  branding?: CompanyBranding | null;
}

// Logo upload options
export interface LogoUploadOptions {
  maxSize?: number; // in bytes, default 2MB
  allowedTypes?: string[]; // MIME types, default image types
  maxWidth?: number; // max width in pixels
  maxHeight?: number; // max height in pixels
}

// Logo upload result
export interface LogoUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  width?: number;
  height?: number;
}
