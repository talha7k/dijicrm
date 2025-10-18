import type { DocumentTemplate } from "$lib/types/document";
import { Timestamp } from "@firebase/firestore";

export const businessEstablishmentContractTemplate: DocumentTemplate = {
  id: "sample-business-establishment",
  companyId: "sample",
  name: "Business Establishment Setup Contract",
  description:
    "Professional business establishment setup contract with company branding and colors",
  type: "business",
  isActive: true,
  version: 1,
  createdBy: "system",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  htmlContent: `
    <div class="contract-container" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); color: #333; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 10px;">
      <!-- Company Header with Branding -->
      <header class="contract-header" style="text-align: center; margin-bottom: 40px; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, {{primaryColor}}, {{secondaryColor}}); border-radius: 10px 10px 0 0;"></div>
         <div class="company-logo" style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 50%; display: inline-block; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
           {{#if companyLogo}}
           <img src="{{companyLogo}}" alt="Company Logo" style="max-width: 150px; max-height: 80px;" />
           {{/if}}
         </div>
        <h1 style="color: {{primaryColor}}; font-size: 32px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">{{companyName}}</h1>
        <div style="width: 100px; height: 3px; background: {{secondaryColor}}; margin: 15px auto;"></div>
        <h2 style="color: {{primaryColor}}; font-size: 22px; margin: 10px 0; font-weight: 500; opacity: 0.9;">Contract – Business Establishment Setup</h2>
      </header>

      <!-- Introduction -->
      <div class="introduction" style="margin-bottom: 40px; background: white; padding: 25px; border-radius: 8px; border-left: 5px solid {{secondaryColor}}; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <p style="font-size: 16px; margin-bottom: 0; line-height: 1.7;">
          <strong style="color: {{primaryColor}};">{{companyName}}</strong> is pleased to present this proposal to assist <strong style="color: {{secondaryColor}};">{{clientName}}</strong> in establishing their business presence in the Kingdom of Saudi Arabia (KSA). Our comprehensive services are specifically designed to facilitate a seamless entry into the Saudi market while ensuring full compliance with all regulatory requirements for business operation.
        </p>
      </div>

      <!-- Proposed Services -->
      <div class="services-section" style="margin-bottom: 40px;">
        <h3 style="color: {{primaryColor}}; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Proposed Services</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, {{secondaryColor}}, {{primaryColor}});"></div>
        </h3>
        <p style="margin-bottom: 20px; font-size: 15px; color: #666;">The proposal outlines the following service package:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 15px rgba(0,0,0,0.08);">
          <thead>
            <tr style="background: linear-gradient(90deg, {{primaryColor}}, {{secondaryColor}}); color: white;">
              <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 16px;">Business Registration Services</th>
              <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 16px; width: 80px;">✓</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 15px; font-weight: 500;">Document Preparation</td>
              <td style="padding: 15px; text-align: center; color: {{secondaryColor}}; font-weight: bold;">✓</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 15px; font-weight: 500;">Registration with Relevant Saudi Authorities</td>
              <td style="padding: 15px; text-align: center; color: {{secondaryColor}}; font-weight: bold;">✓</td>
            </tr>
          </tbody>
        </table>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <h4 style="color: {{primaryColor}}; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid {{secondaryColor}}; padding-bottom: 5px;">Saudi Authorities</h4>
            <ol style="padding-left: 20px; line-height: 1.6;">
              <li style="margin-bottom: 8px;">Ministry of Investment of Saudi Arabia (MISA)</li>
              <li style="margin-bottom: 8px;">Saudi Business Center (SBC)</li>
              <li style="margin-bottom: 8px;">Saudi Post & Logistics (SPL)</li>
              <li style="margin-bottom: 8px;">General Organization for Social Insurance (GOSI)</li>
              <li style="margin-bottom: 8px;">Zakat, Tax and Customs Authority (ZATCA)</li>
              <li style="margin-bottom: 8px;">Chamber of Commerce (COC)</li>
              <li style="margin-bottom: 8px;">Ministry of Human Resources and Social Development (HRSD)</li>
              <li style="margin-bottom: 8px;">QIWA – (HRSD)</li>
              <li style="margin-bottom: 8px;">MUQEEM, ABSHER (Ministry of Interior "MOI")</li>
              <li>MUDAD (Payroll Compliance System)</li>
            </ol>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <h4 style="color: {{primaryColor}}; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid {{secondaryColor}}; padding-bottom: 5px;">Application & Licensing</h4>
            <ol style="padding-left: 20px; line-height: 1.6;">
              <li style="margin-bottom: 8px;">MISA License</li>
              <li style="margin-bottom: 8px;">Trade Name Reservation</li>
              <li style="margin-bottom: 8px;">Articles of Association (AOA) Drafting</li>
              <li style="margin-bottom: 8px;">Attesting the AOA</li>
              <li style="margin-bottom: 8px;">CR Issuance</li>
              <li style="margin-bottom: 8px;">ZATCA Certifications</li>
              <li style="margin-bottom: 8px;">National Address</li>
              <li style="margin-bottom: 8px;">GM VISA</li>
              <li style="margin-bottom: 8px;">Medical Checkups</li>
              <li style="margin-bottom: 8px;">Work Permit</li>
              <li style="margin-bottom: 8px;">Health Insurance Policy</li>
              <li style="margin-bottom: 8px;">GM IQAMA</li>
              <li style="margin-bottom: 8px;">Assistance in Bank Account Opening</li>
              <li>Company Seal</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Required Documents -->
      <div class="documents-section" style="margin-bottom: 40px;">
        <h3 style="color: {{primaryColor}}; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Required Documents</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, {{secondaryColor}}, {{primaryColor}});"></div>
        </h3>
        <p style="margin-bottom: 20px; font-size: 15px; color: #666;">To initiate the process <strong style="color: {{secondaryColor}};">{{clientName}}</strong> will need to submit the following documents:</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid {{primaryColor}};">
            <h4 style="color: {{primaryColor}}; font-size: 16px; margin-bottom: 15px;">Phase 1 Documents</h4>
            <ul style="padding-left: 20px; line-height: 1.6;">
              <li style="margin-bottom: 8px;">All legal documents of the Company</li>
              <li style="margin-bottom: 8px;">Certificate of Incorporation</li>
              <li style="margin-bottom: 8px;">AOA – Articles of Association</li>
              <li style="margin-bottom: 8px;">MOA – Memorandum of Association</li>
              <li style="margin-bottom: 8px;">Latest Financial Audit Report</li>
              <li style="margin-bottom: 8px;">POA – Power of Attorney authorizing {{companyName}} representatives to act on behalf of {{clientName}}. (Template will be provided)</li>
              <li style="background: {{lightBackgroundColor}}; padding: 8px; border-radius: 4px; font-weight: bold; color: {{primaryColor}};">All required documents should be attested by Ministry of Foreign Affairs and Saudi Embassy in the country of Origin</li>
            </ul>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid {{secondaryColor}};">
            <h4 style="color: {{secondaryColor}}; font-size: 16px; margin-bottom: 15px;">Phase 2 Documents</h4>
            <ul style="padding-left: 20px; line-height: 1.6;">
              <li style="margin-bottom: 8px;">Company Incorporation Intent (Form will be provided)</li>
              <li>Initial Payment Remittance</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="timeline-section" style="margin-bottom: 40px;">
        <h3 style="color: {{primaryColor}}; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Timeline</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, {{secondaryColor}}, {{primaryColor}});"></div>
        </h3>
        <p style="margin-bottom: 20px; font-size: 15px; color: #666;"><strong>Business registration & licensing:</strong> The processing timeline varies depending on individual case requirements and government processing times.</p>

        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 15px rgba(0,0,0,0.08);">
          <thead>
            <tr style="background: linear-gradient(90deg, {{primaryColor}}, {{secondaryColor}}); color: white;">
              <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 16px;">Stage</th>
              <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 16px;">Description</th>
              <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 16px;">Estimated Time</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 15px; font-weight: 600; color: {{primaryColor}};">Stage 1</td>
              <td style="padding: 15px;">Documentation (varies on attesting and shipping original documents)</td>
              <td style="padding: 15px; text-align: center; font-weight: 500; color: {{secondaryColor}};">1-2 weeks</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee; background: {{lightBackgroundColor}};">
              <td style="padding: 15px; font-weight: 600; color: {{primaryColor}};">Stage 2</td>
              <td style="padding: 15px;">Registration/licensing & establishment</td>
              <td style="padding: 15px; text-align: center; font-weight: 500; color: {{secondaryColor}};">6-7 weeks</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 15px; font-weight: 600; color: {{primaryColor}};">Stage 3</td>
              <td style="padding: 15px;">GM arrival process</td>
              <td style="padding: 15px; text-align: center; font-weight: 500; color: {{secondaryColor}};">1-2 weeks</td>
            </tr>
            <tr style="background: {{lightBackgroundColor}};">
              <td style="padding: 15px; font-weight: 600; color: {{primaryColor}};">Stage 4</td>
              <td style="padding: 15px;">Finalizing & handover</td>
              <td style="padding: 15px; text-align: center; font-weight: 500; color: {{secondaryColor}};">1-2 weeks</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pricing & Payment Terms -->
      <div class="pricing-section" style="margin-bottom: 40px;">
        <h3 style="color: {{primaryColor}}; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Pricing & Payment Terms</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, {{secondaryColor}}, {{primaryColor}});"></div>
        </h3>

        <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid {{secondaryColor}}; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
          <h4 style="margin: 0 0 15px 0; font-size: 18px; color: {{primaryColor}};">Service Fee Breakdown</h4>
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 15px; color: {{primaryColor}};">{{formatCurrency serviceFee}} SAR</div>
          <p style="margin: 0; color: #666; font-size: 14px;">(excluding visa, IQAMA, medical check-ups, work permit and medical insurance policy)</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 15px rgba(0,0,0,0.08); margin-bottom: 20px;">
          <thead>
            <tr style="background: {{primaryColor}}; color: white;">
              <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 16px;">Payment Milestone</th>
              <th style="padding: 15px; text-align: right; font-weight: 600; font-size: 16px;">Amount</th>
              <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 16px;">Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 15px; font-weight: 500;">Upon signing the contract</td>
              <td style="padding: 15px; text-align: right; font-weight: 600; color: {{secondaryColor}};">{{formatCurrency (divide serviceFee 2)}} SAR</td>
              <td style="padding: 15px; text-align: center; font-weight: 500;">50%</td>
            </tr>
            <tr style="background: {{lightBackgroundColor}};">
              <td style="padding: 15px; font-weight: 500;">Upon MISA issuance processing</td>
              <td style="padding: 15px; text-align: right; font-weight: 600; color: {{secondaryColor}};">{{formatCurrency (divide serviceFee 2)}} SAR</td>
              <td style="padding: 15px; text-align: center; font-weight: 500;">50%</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #fff3cd; border: 2px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">⚠️ Government & Third-Party Fees</h4>
          <p style="margin: 0; color: #856404;">Expenses related to visa issuance, IQAMA, Medical insurance policy, medical examinations, and work permit processing are not covered under the service fee and will be charged separately, as applicable.</p>
        </div>

        <div style="background: #f8d7da; border: 2px solid #f5c6cb; padding: 20px; border-radius: 8px;">
          <h4 style="color: #721c24; margin: 0 0 10px 0; font-size: 16px;">📋 Important Note - MISA Charges</h4>
          <p style="margin: 0; color: #721c24;">The Ministry is currently updating its fee structure, and the new charges have not yet been disclosed. Once the fee structure is announced by the Ministry, the client will be required to remit payment within 10 days.</p>
        </div>
      </div>

      <!-- Amendments -->
      <div class="amendments-section" style="margin-bottom: 40px;">
        <h3 style="color: {{primaryColor}}; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Amendments</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, {{secondaryColor}}, {{primaryColor}});"></div>
        </h3>
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 5px solid #ffc107; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <p style="margin: 0; line-height: 1.6;">Any amendments that reflect on Company incorporation Intent form during the process will affect the timeline and might cost additional charges and that will be billed separately.</p>
        </div>
      </div>

      <!-- Footer with Company Branding -->
      <footer class="contract-footer" style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 3px solid {{secondaryColor}}; position: relative;">
        <div style="position: absolute; top: -3px; left: 50%; transform: translateX(-50%); width: 200px; height: 6px; background: linear-gradient(90deg, {{primaryColor}}, {{secondaryColor}}); border-radius: 3px;"></div>
         <div class="company-stamp" style="margin-bottom: 25px; display: inline-block; padding: 15px; background: white; border-radius: 50%; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
           {{#if companyStamp}}
           <img src="{{companyStamp}}" alt="Company Stamp" style="max-width: 100px; max-height: 100px;" />
           {{/if}}
         </div>
        <h4 style="color: {{primaryColor}}; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">{{companyName}}</h4>
        <p style="font-size: 14px; color: #666; margin: 5px 0;">{{companyAddress}}</p>
        <p style="font-size: 14px; color: #666; margin: 5px 0;">{{companyPhone}} | {{companyEmail}}</p>
        <div style="margin-top: 20px; padding: 10px 20px; background: {{lightBackgroundColor}}; border-radius: 20px; display: inline-block;">
          <p style="font-size: 12px; color: {{primaryColor}}; margin: 0; font-weight: 500;">Generated on: {{currentDate}}</p>
        </div>
      </footer>
    </div>
  `,
  placeholders: [
    {
      key: "serviceFee",
      label: "Service Fee Amount (SAR)",
      type: "number",
      required: true,
    },
    {
      key: "primaryColor",
      label: "Primary Brand Color (hex)",
      type: "text",
      required: false,
      defaultValue: "#1f2937",
    },
    {
      key: "secondaryColor",
      label: "Secondary Brand Color (hex)",
      type: "text",
      required: false,
      defaultValue: "#3b82f6",
    },
    {
      key: "lightBackgroundColor",
      label: "Light Background Color (hex)",
      type: "text",
      required: false,
      defaultValue: "#f8fafc",
    },
  ],
  tags: [
    "business",
    "contract",
    "establishment",
    "saudi-arabia",
    "registration",
  ],
};
