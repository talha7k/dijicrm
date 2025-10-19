import type { DocumentTemplate } from "$lib/types/document";
import { Timestamp } from "@firebase/firestore";

export const serviceAgreementTemplate: DocumentTemplate = {
  id: "sample-contract",
  companyId: "sample",
  name: "Service Agreement Template",
  description:
    "Standard service agreement with customizable terms and conditions",
  type: "business",
  isActive: true,
  version: 1,
  createdBy: "system",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  htmlContent: `
    <div class="contract-container" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #ffffff 0%, #f0f9f0 100%); color: #333; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 10px;">
      <!-- Header with Branding -->
      <header class="contract-header" style="text-align: center; margin-bottom: 40px; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, #14532d, #22c55e); border-radius: 10px 10px 0 0;"></div>
         <div class="company-logo" style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 50%; display: inline-block; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
           {{#if companyLogo}}
           <img src="{{companyLogo}}" alt="Company Logo" style="max-width: 150px; max-height: 80px;" />
           {{/if}}
         </div>
        <h1 style="color: #14532d; font-size: 32px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Service Agreement</h1>
        <div style="width: 100px; height: 3px; background: #22c55e; margin: 15px auto;"></div>
        <h2 style="color: #14532d; font-size: 22px; margin: 10px 0; font-weight: 500; opacity: 0.9;">{{companyName}} & {{clientName}}</h2>
      </header>

      <!-- Parties Information -->
      <div class="parties-section" style="margin-bottom: 40px;">
        <h3 style="color: #14532d; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Parties</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #22c55e, #14532d);"></div>
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #14532d;">
            <h4 style="color: #14532d; font-size: 18px; margin-bottom: 15px;">Service Provider</h4>
            <p style="margin: 8px 0; font-size: 14px; color: #666;"><strong style="color: #14532d;">{{companyName}}</strong></p>
            <p style="margin: 8px 0; font-size: 14px; color: #666;">{{companyAddress}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #666;">{{companyPhone}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #666;">{{companyEmail}}</p>
          </div>
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #22c55e;">
            <h4 style="color: #22c55e; font-size: 18px; margin-bottom: 15px;">Client</h4>
            <p style="margin: 8px 0; font-size: 14px; color: #666;"><strong style="color: #22c55e;">{{clientName}}</strong></p>
            <p style="margin: 8px 0; font-size: 14px; color: #666;">{{clientAddress}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #666;">{{clientPhone}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #666;">{{clientEmail}}</p>
          </div>
        </div>
      </div>

      <!-- Contract Body -->
      <div class="contract-body" style="margin-bottom: 40px;">
        <!-- Services Section -->
        <div class="section" style="margin-bottom: 30px; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <h3 style="color: #14532d; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">1. Services</h3>
          <p style="line-height: 1.6; color: #666; margin: 0;">{{servicesDescription}}</p>
        </div>

        <!-- Payment Terms Section -->
        <div class="section" style="margin-bottom: 30px; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <h3 style="color: #14532d; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">2. Payment Terms</h3>
          <div style="background: #f0f9f0; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <p style="margin: 8px 0; font-size: 14px; color: #666;"><strong style="color: #14532d;">Total Amount:</strong> {{formatCurrency totalAmount}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #666;"><strong style="color: #14532d;">Payment Schedule:</strong> {{paymentSchedule}}</p>
          </div>
        </div>

        <!-- Term Section -->
        <div class="section" style="margin-bottom: 30px; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <h3 style="color: #14532d; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">3. Term</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: #f0f9f0; padding: 15px; border-radius: 6px;">
              <p style="margin: 0; font-size: 14px; color: #666;"><strong style="color: #14532d;">Start Date:</strong> {{startDate}}</p>
            </div>
            <div style="background: #f0f9f0; padding: 15px; border-radius: 6px;">
              <p style="margin: 0; font-size: 14px; color: #666;"><strong style="color: #14532d;">End Date:</strong> {{endDate}}</p>
            </div>
          </div>
        </div>

        <!-- Signatures Section -->
        <div class="section" style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <h3 style="color: #14532d; font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">4. Signatures</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div style="text-align: center; padding: 20px; border: 2px dashed #22c55e; border-radius: 8px;">
              <h4 style="color: #14532d; margin-bottom: 15px; font-size: 16px;">Service Provider</h4>
              <div style="height: 60px; border-bottom: 2px solid #14532d; margin-bottom: 15px;"></div>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">{{companyName}}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">Date: _______________</p>
            </div>
            <div style="text-align: center; padding: 20px; border: 2px dashed #14532d; border-radius: 8px;">
              <h4 style="color: #22c55e; margin-bottom: 15px; font-size: 16px;">Client</h4>
              <div style="height: 60px; border-bottom: 2px solid #22c55e; margin-bottom: 15px;"></div>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">{{clientName}}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">Date: _______________</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer with Company Branding -->
      <footer class="contract-footer" style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 3px solid #22c55e; position: relative;">
        <div style="position: absolute; top: -3px; left: 50%; transform: translateX(-50%); width: 200px; height: 6px; background: linear-gradient(90deg, #14532d, #22c55e); border-radius: 3px;"></div>
         <div class="company-stamp" style="margin-bottom: 25px; display: inline-block; padding: 15px; background: white; border-radius: 50%; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
           {{#if companyStamp}}
           <img src="{{companyStamp}}" alt="Company Stamp" style="max-width: 100px; max-height: 100px;" />
           {{/if}}
         </div>
        <h4 style="color: #14532d; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">{{companyName}}</h4>
        <p style="font-size: 14px; color: #666; margin: 5px 0;">{{companyAddress}}</p>
        <p style="font-size: 14px; color: #666; margin: 5px 0;">{{companyPhone}} | {{companyEmail}}</p>
        <div style="margin-top: 20px; padding: 10px 20px; background: #f0f9f0; border-radius: 20px; display: inline-block;">
          <p style="font-size: 12px; color: #14532d; margin: 0; font-weight: 500;">Generated on: {{currentDate}}</p>
        </div>
      </footer>
    </div>
  `,
  placeholders: [
    {
      key: "servicesDescription",
      label: "Services Description",
      type: "text",
      required: true,
    },
    {
      key: "paymentSchedule",
      label: "Payment Schedule",
      type: "text",
      required: true,
    },
    { key: "startDate", label: "Start Date", type: "date", required: true },
    { key: "endDate", label: "End Date", type: "date", required: true },
  ],
  tags: ["contract", "service-agreement"],
};
