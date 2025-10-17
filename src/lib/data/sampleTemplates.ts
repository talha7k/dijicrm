import type { DocumentTemplate } from "$lib/types/document";
import { businessEstablishmentContractTemplate } from "./templates/business-establishment-contract";
import { invoiceTemplate } from "./templates/invoice-template";
import { powerOfAttorneyTemplate } from "./templates/power-of-attorney-template";
import { serviceAgreementTemplate } from "./templates/service-agreement-template";
import { companyIncorporationIntentFormTemplate } from "./templates/company-incorporation-intent-form";

export const sampleTemplates: DocumentTemplate[] = [
  businessEstablishmentContractTemplate,
  invoiceTemplate,
  powerOfAttorneyTemplate,
  serviceAgreementTemplate,
  companyIncorporationIntentFormTemplate,
];
