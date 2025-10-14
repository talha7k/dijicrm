import type { Timestamp } from "@firebase/firestore";

export interface ProductService {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category: "service" | "product" | "package";
  price?: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DocumentRequirementRule {
  id: string;
  companyId: string;
  name: string;
  description?: string;

  // What triggers this requirement
  triggerType:
    | "product_selected"
    | "service_selected"
    | "amount_threshold"
    | "custom";
  triggerConditions: RequirementCondition[];

  // What documents are required
  requiredDocuments: RequiredDocument[];

  // Rule settings
  isMandatory: boolean;
  priority: number; // Higher numbers = higher priority
  isActive: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RequirementCondition {
  field: string; // e.g., 'productId', 'amount', 'clientType'
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  value: string | number | boolean | string[];
}

export interface RequiredDocument {
  templateId: string;
  templateName: string; // For display purposes
  isMandatory: boolean;
  conditions?: RequirementCondition[]; // Additional conditions for this specific document
  notes?: string; // Instructions for when this document is required
}

export interface CaseRequirements {
  orderId: string;
  clientId: string;
  companyId: string;

  // Selected products/services
  selectedItems: {
    itemId: string;
    itemType: "product" | "service";
    quantity: number;
    amount: number;
  }[];

  // Calculated requirements
  requiredDocuments: {
    templateId: string;
    ruleId?: string; // Which rule triggered this requirement
    isMandatory: boolean;
    reason: string; // Why this document is required
  }[];

  // Status
  status: "calculating" | "ready" | "approved" | "completed";
  calculatedAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;

  metadata: {
    totalAmount: number;
    clientType?: string;
    specialConditions?: string[];
  };
}

// Predefined requirement templates for common scenarios
export const COMMON_REQUIREMENT_RULES: Omit<
  DocumentRequirementRule,
  "id" | "companyId" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Business Formation Documents",
    description: "Required documents for business formation services",
    triggerType: "service_selected",
    triggerConditions: [
      {
        field: "serviceId",
        operator: "in",
        value: ["business-formation", "llc-setup", "incorporation"],
      },
    ],
    requiredDocuments: [
      {
        templateId: "power-of-attorney-template",
        templateName: "Power of Attorney",
        isMandatory: true,
        notes: "Required for business registration",
      },
      {
        templateId: "intent-form-template",
        templateName: "Statement of Intent",
        isMandatory: true,
        notes: "Business purpose declaration",
      },
    ],
    isMandatory: true,
    priority: 10,
    isActive: true,
  },
  {
    name: "High-Value Transactions",
    description: "Additional documentation for transactions over $10,000",
    triggerType: "amount_threshold",
    triggerConditions: [
      { field: "totalAmount", operator: "greater_than", value: 10000 },
    ],
    requiredDocuments: [
      {
        templateId: "financial-statement-template",
        templateName: "Financial Statement",
        isMandatory: false,
        notes: "Recommended for transactions over $10,000",
      },
    ],
    isMandatory: false,
    priority: 5,
    isActive: true,
  },
];
