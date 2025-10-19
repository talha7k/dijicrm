import type { DocumentTemplate } from "$lib/types/document";
import { Timestamp } from "@firebase/firestore";

export const companyIncorporationIntentFormTemplate: DocumentTemplate = {
  id: "sample-company-incorporation-intent",
  companyId: "sample",
  name: "Company Incorporation Intent Form",
  description:
    "Professional fillable company incorporation intent form for client completion with Saudi entity details and business activities",
  type: "business",
  isActive: true,
  version: 1,
  createdBy: "system",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  htmlContent: `
    <div class="intent-form-container" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #ffffff 0%, #f0f9f0 100%); color: #333; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 10px;">
      <!-- Header with Branding -->
      <header class="form-header" style="text-align: center; margin-bottom: 40px; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, #14532d, #22c55e); border-radius: 10px 10px 0 0;"></div>
         <div class="company-logo" style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 50%; display: inline-block; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
           {{#if companyLogo}}
           <img src="{{companyLogo}}" alt="Company Logo" style="max-width: 150px; max-height: 80px;" />
           {{/if}}
         </div>
        <h1 style="color: #14532d; font-size: 32px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">{{companyName}}</h1>
        <div style="width: 100px; height: 3px; background: #22c55e; margin: 15px auto;"></div>
        <h2 style="color: #14532d; font-size: 22px; margin: 10px 0; font-weight: 500; opacity: 0.9;">Company Incorporation Intent Form</h2>
      </header>

      <!-- Client Information Section -->
      <div class="section" style="margin-bottom: 40px;">
        <h3 style="color: #14532d; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Client Information</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #22c55e, #14532d);"></div>
        </h3>
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Client Name</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 20px;"></div>
            </div>
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Contact Person</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 20px;"></div>
            </div>
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Email Address</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 20px;"></div>
            </div>
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Phone Number</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 20px;"></div>
            </div>
            <div class="form-field" style="grid-column: span 2;">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Client Address</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 50px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Saudi Entity Details Section -->
      <div class="section" style="margin-bottom: 40px;">
        <h3 style="color: #14532d; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Saudi Entity Details</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #22c55e, #14532d);"></div>
        </h3>
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Entity Type</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 20px;"></div>
            </div>
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Legal Structure</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 20px;"></div>
            </div>
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Share Capital (SAR)</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 20px;"></div>
            </div>
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Number of Shareholders</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 20px;"></div>
            </div>
            <div class="form-field" style="grid-column: span 2;">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Proposed Business Location</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 50px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Business Activities Section -->
      <div class="section" style="margin-bottom: 40px;">
        <h3 style="color: #14532d; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Business Activities</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #22c55e, #14532d);"></div>
        </h3>
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <div class="form-field" style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Primary Business Activity</label>
            <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 50px;"></div>
          </div>
          <div class="form-field">
            <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Secondary Business Activities</label>
            <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 80px;"></div>
          </div>
        </div>
      </div>

      <!-- Trade Names Section -->
      <div class="section" style="margin-bottom: 40px;">
        <h3 style="color: #14532d; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Proposed Trade Names</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #22c55e, #14532d);"></div>
        </h3>
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">1st Choice</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 30px;"></div>
            </div>
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">2nd Choice</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 30px;"></div>
            </div>
            <div class="form-field">
              <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">3rd Choice</label>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 30px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Information Section -->
      <div class="section" style="margin-bottom: 40px;">
        <h3 style="color: #14532d; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Additional Information</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #22c55e, #14532d);"></div>
        </h3>
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <div class="form-field" style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Special Requirements</label>
            <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 80px;"></div>
          </div>
          <div class="form-field">
            <label style="display: block; font-weight: 600; color: #14532d; margin-bottom: 8px;">Timeline Expectations</label>
            <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 50px;"></div>
          </div>
        </div>
      </div>

      <!-- Authorization Section -->
      <div class="section" style="margin-bottom: 40px;">
        <h3 style="color: #14532d; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Client Authorization</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #22c55e, #14532d);"></div>
        </h3>
        <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <div style="margin-bottom: 25px;">
            <p style="font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 20px;">
              I hereby authorize {{companyName}} to proceed with the company incorporation process in the Kingdom of Saudi Arabia based on the information provided above. I understand that this is an intent form and final details may be subject to regulatory approval and availability.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div class="signature-section" style="text-align: center;">
              <h4 style="color: #14532d; margin-bottom: 20px;">Client Signature</h4>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 70px; border-bottom: 2px solid #14532d;"></div>
              <div style="margin-top: 15px;">
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Name: <span style="border-bottom: 2px solid #14532d; display: inline-block; width: 200px; margin-left: 5px;"></span></p>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Date: <span style="border-bottom: 2px solid #14532d; display: inline-block; width: 200px; margin-left: 5px;"></span></p>
              </div>
            </div>

            <div class="signature-section" style="text-align: center;">
              <h4 style="color: #14532d; margin-bottom: 20px;">Company Representative</h4>
              <div style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; min-height: 70px; border-bottom: 2px solid #22c55e;"></div>
              <div style="margin-top: 15px;">
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Name: <span style="border-bottom: 2px solid #22c55e; display: inline-block; width: 200px; margin-left: 5px;"></span></p>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Date: <span style="border-bottom: 2px solid #22c55e; display: inline-block; width: 200px; margin-left: 5px;"></span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer with Company Branding -->
      <footer class="form-footer" style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 3px solid #22c55e; position: relative;">
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
      key: "contactPerson",
      label: "Contact Person",
      type: "text",
      required: true,
    },
    { key: "entityType", label: "Entity Type", type: "text", required: true },
    {
      key: "legalStructure",
      label: "Legal Structure",
      type: "text",
      required: true,
    },
    {
      key: "shareCapital",
      label: "Share Capital (SAR)",
      type: "number",
      required: true,
    },
    {
      key: "numberOfShareholders",
      label: "Number of Shareholders",
      type: "number",
      required: true,
    },
    {
      key: "businessLocation",
      label: "Business Location",
      type: "text",
      required: true,
    },
    {
      key: "primaryActivity",
      label: "Primary Business Activity",
      type: "text",
      required: true,
    },
    {
      key: "secondaryActivities",
      label: "Secondary Activities",
      type: "text",
      required: false,
    },
    {
      key: "tradeName1",
      label: "Trade Name 1st Choice",
      type: "text",
      required: true,
    },
    {
      key: "tradeName2",
      label: "Trade Name 2nd Choice",
      type: "text",
      required: false,
    },
    {
      key: "tradeName3",
      label: "Trade Name 3rd Choice",
      type: "text",
      required: false,
    },
    {
      key: "specialRequirements",
      label: "Special Requirements",
      type: "text",
      required: false,
    },
    {
      key: "timelineExpectations",
      label: "Timeline Expectations",
      type: "text",
      required: false,
    },
    {
      key: "primaryColor",
      label: "Primary Brand Color (hex)",
      type: "text",
      required: false,
      defaultValue: "#14532d",
    },
    {
      key: "secondaryColor",
      label: "Secondary Brand Color (hex)",
      type: "text",
      required: false,
      defaultValue: "#22c55e",
    },
    {
      key: "lightBackgroundColor",
      label: "Light Background Color (hex)",
      type: "text",
      required: false,
      defaultValue: "#f0f9f0",
    },
  ],
  tags: [
    "business",
    "incorporation",
    "intent-form",
    "saudi-arabia",
    "company-formation",
  ],
};
