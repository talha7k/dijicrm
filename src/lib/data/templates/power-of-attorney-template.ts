import type { DocumentTemplate } from "$lib/types/document";
import { Timestamp } from "@firebase/firestore";

export const powerOfAttorneyTemplate: DocumentTemplate = {
  id: "sample-power-of-attorney",
  companyId: "sample",
  name: "Power of Attorney Template",
  description:
    "Professional bilingual Power of Attorney template with Arabic and English side by side",
  type: "legal",
  isActive: true,
  version: 1,
  createdBy: "system",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  htmlContent: `
    <div class="poa-container" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1200px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); color: #333; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 10px;">
      <!-- Header -->
      <header class="poa-header" style="text-align: center; margin-bottom: 40px; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, #1f2937, #3b82f6); border-radius: 10px 10px 0 0;"></div>
         <div class="company-logo" style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 50%; display: inline-block; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
           {{#if companyLogo}}
           <img src="{{companyLogo}}" alt="Company Logo" style="max-width: 150px; max-height: 80px;" />
           {{/if}}
         </div>
        <h1 style="color: #1f2937; font-size: 32px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">POWER OF ATTORNEY</h1>
        <div style="width: 100px; height: 3px; background: #3b82f6; margin: 15px auto;"></div>
        <h2 style="color: #1f2937; font-size: 18px; margin: 10px 0; font-weight: 500; opacity: 0.9;">وكالة قانونية</h2>
      </header>

      <!-- Principal Declaration -->
      <div class="principal-info" style="margin-bottom: 40px; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <h3 style="color: #1f2937; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Principal Declaration</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #3b82f6, #1f2937);"></div>
        </h3>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <!-- Arabic Column -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-right: 4px solid #1f2937;">
            <h4 style="color: #1f2937; margin-bottom: 15px; text-align: center; font-size: 16px;">النص العربي</h4>
            <div style="direction: rtl; text-align: right; line-height: 1.8; font-size: 14px;">
               <p style="margin-bottom: 15px;">أنا الموقع أدناه، ({{clientFirstName}} {{clientLastName}})، ({{nationality}}) الجنسية، بموجب جواز سفر رقم ({{passportNumber}})، تاريخ الإصدار ({{passportIssueDate}})، تاريخ الانتهاء ({{passportExpirationDate}})، مكان الإصدار ({{passportIssuePlace}})، بصفتي ({{principalCapacity}})، في شركة ({{companyName}})، تأسست بموجب قوانين ({{countryOfOrigin}})، سجل تجاري ({{companyRegistration}})، وعنوانها المسجل ({{companyAddress}})، ("الشركة")، وحسب الصلاحيات الممنوحة لي بموجب _____، أقمت ووكلت كلاً من:</p>
            </div>
          </div>

          <!-- English Column -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h4 style="color: #3b82f6; margin-bottom: 15px; text-align: center; font-size: 16px;">English Text</h4>
            <div style="line-height: 1.8; font-size: 14px;">
               <p style="margin-bottom: 15px;">I, the undersigned, {{clientFirstName}} {{clientLastName}}, {{nationality}} national, under passport number {{passportNumber}}, date of issuance {{passportIssueDate}}, expiration date {{passportExpirationDate}}, place of issuance {{passportIssuePlace}}, in my capacity as {{principalCapacity}} of {{companyName}}, an entity validly registered under the {{countryOfOrigin}} laws with a commercial registration number {{companyRegistration}}, and a registered address at {{companyAddress}} (the "Company"), pursuant to powers granted to me under ____, hereby appoint and authorize:</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Attorneys Section -->
      <div class="attorneys-section" style="margin-bottom: 40px;">
        <h3 style="color: #1f2937; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Authorized Attorneys</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #3b82f6, #1f2937);"></div>
        </h3>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          <!-- Attorney 1 -->
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #3b82f6;">
            <h4 style="color: #1f2937; margin-bottom: 15px; font-size: 16px;">1. شركة تبادل الكون القابضة</h4>
            <div style="direction: rtl; text-align: right; margin-bottom: 10px;">
              <p style="margin: 0; font-size: 14px; color: #666;">الرقم الموحد: 7038490012</p>
              <p style="margin: 0; font-size: 14px; color: #666;">تاريخ الإصدار: 28/02/2024 م</p>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
              <h5 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">TABADL ALKON HOLDING COMPANY</h5>
              <p style="margin: 0; font-size: 14px; color: #666;">National No. 7038490012</p>
              <p style="margin: 0; font-size: 14px; color: #666;">Date of Issue. 28/02/2024</p>
            </div>
          </div>

          <!-- Attorney 2 -->
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #3b82f6;">
            <h4 style="color: #1f2937; margin-bottom: 15px; font-size: 16px;">2. عمر بن عبدالله بن عبدالعزيز الصنيع</h4>
            <div style="direction: rtl; text-align: right; margin-bottom: 10px;">
              <p style="margin: 0; font-size: 14px; color: #666;">سجل مدني رقم: 1083945848</p>
              <p style="margin: 0; font-size: 14px; color: #666;">تاريخ انتهاء الهوية: 27/11/2025م</p>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
              <h5 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">ALSANEEA, OMER ABDULLAH A.</h5>
              <p style="margin: 0; font-size: 14px; color: #666;">Civil Register No. 1083945848</p>
              <p style="margin: 0; font-size: 14px; color: #666;">DOE. 27/11/2025</p>
            </div>
          </div>

          <!-- Attorney 3 -->
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #3b82f6;">
            <h4 style="color: #1f2937; margin-bottom: 15px; font-size: 16px;">3. عمار بن عبد الله بن عبد العزيز الصنيع</h4>
            <div style="direction: rtl; text-align: right; margin-bottom: 10px;">
              <p style="margin: 0; font-size: 14px; color: #666;">سجل مدني رقم: 1102047741</p>
              <p style="margin: 0; font-size: 14px; color: #666;">تاريخ انتهاء الهوية: 14/07/2029 م</p>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
              <h5 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">ALSANEEA, AMAR ABDULLAH A.</h5>
              <p style="margin: 0; font-size: 14px; color: #666;">Civil Register No. 1102047741</p>
              <p style="margin: 0; font-size: 14px; color: #666;">DOE. 14/07/2029</p>
            </div>
          </div>

          <!-- Attorney 4 -->
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #3b82f6;">
            <h4 style="color: #1f2937; margin-bottom: 15px; font-size: 16px;">4. نواف بن عبدالمحسن بن دحيم الحنتوشي العتيبي</h4>
            <div style="direction: rtl; text-align: right; margin-bottom: 10px;">
              <p style="margin: 0; font-size: 14px; color: #666;">سجل مدني رقم: 1061231245</p>
              <p style="margin: 0; font-size: 14px; color: #666;">تاريخ انتهاء الهوية: 02/03/2029</p>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
              <h5 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">ALOTAIBI, NAWAF ABDULMOHSEN D.</h5>
              <p style="margin: 0; font-size: 14px; color: #666;">Civil Register No. 1061231245</p>
              <p style="margin: 0; font-size: 14px; color: #666;">DOE. 02/03/2029</p>
            </div>
          </div>

          <!-- Attorney 5 -->
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #3b82f6;">
            <h4 style="color: #1f2937; margin-bottom: 15px; font-size: 16px;">5. د. عبدالله بن عبدالعزيز بن عبدالله الصنيع</h4>
            <div style="direction: rtl; text-align: right; margin-bottom: 10px;">
              <p style="margin: 0; font-size: 14px; color: #666;">سجل مدني رقم: 1003990619</p>
              <p style="margin: 0; font-size: 14px; color: #666;">تاريخ انتهاء الهوية: 02/ 12 /2039 م</p>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
              <h5 style="color: #3b82f6; margin-bottom: 8px; font-size: 14px;">Dr. ALSANEEA, ABDULLAH ABDULAZIZ A.</h5>
              <p style="margin: 0; font-size: 14px; color: #666;">Civil Register No. 1003990619</p>
              <p style="margin: 0; font-size: 14px; color: #666;">DOE. 02/12/2039</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Powers Granted - Bilingual -->
      <div class="powers-section" style="margin-bottom: 40px;">
        <h3 style="color: #1f2937; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Powers Granted</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #3b82f6, #1f2937);"></div>
        </h3>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <!-- Arabic Column -->
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-right: 4px solid #1f2937;">
            <h4 style="color: #1f2937; margin-bottom: 20px; text-align: center; font-size: 18px;">الصلاحيات الممنوحة (Arabic)</h4>
            <div style="direction: rtl; text-align: right; line-height: 1.8; font-size: 13px;">
              <p style="margin-bottom: 15px;">("الوكلاء الشرعيين")، جميعهم سعوديو الجنسية، وكلاء ينوبون عني بصفتي أعلاه، مجتمعين أو منفردين، ليقوموا مقام الشركة بتأسيس شركة ذات مسؤولية محدودة لشخص او عدد من الأشخاص وذلك وفقاً للأنظمة الواجبة التطبيق في المملكة العربية السعودية، وللوكلاء الشرعيين في سبيل ذلك القيام بما يلي:</p>
              <ol style="padding-right: 20px;">
                <li style="margin-bottom: 8px;">تمثيل الشركة أمام وزارة التجارة، ووزارة الإستثمار، وكتابة العدل، ومكاتب السجل التجاري، وغرف التجارة والصناعة، والإمارات، والمحافظات، ووزارة العدل، ووزارة الخارجية، والبعثات الدبلوماسية، ووزارة المالية، وإدارة الجوازات،  والأحوال المدنية، والبلديات، والدفاع المدني، والمؤسسة العامة للتأمينات الاجتماعية، وهيئة الزكاة والضريبة والجمارك، ووزارة الموارد البشرية والتنمية الاجتماعية، ومكتب العمل، ومكتب الاستقدام، وكافة الوزارات والدوائر الحكومية الأخرى المتعلقة بتأسيس شركة ذات مسؤولية محدودة لشخص او عدة اشخاص في المملكة العربية السعودية؛</li>
                <li style="margin-bottom: 8px;">حجز اسم التجاري للشركة وفق القوانين والأنظمة التي تنظم حجز الاسم في المملكة العربية السعودية؛</li>
                <li style="margin-bottom: 8px;">التوقيع على وتقديم جميع النماذج والطلبات والتعهدات والإقرارات والتعديلات والإيضاحات والبيانات وغيرها من المستندات اللازمة لتأسيس شركة شخص او عدة شركاء ذات مسؤولية محدودة لدى الجهات الحكومية المختصة؛</li>
                <li style="margin-bottom: 8px;">التوثيق والتوقيع على عقد تأسيس الشركة، وقرارات الشركاء، وملاحق التعديل أمام كاتب العدل، وجميع المستندات الأخرى المتعلقة بتعديل عقد التأسيس، والتوقيع على قرارات الشركاء بتعيين المدير و/أو مجلس المديرين للشركة وتحديد صلاحياتهم؛</li>
                <li style="margin-bottom: 8px;">نشر ملخص عقد التأسيس، وجميع الإشعارات والمستندات اللازمة في الجريدة الرسمية وأي جريدة محلية أخرى، وذلك حسب متطلبات الجهات الحكومية المختصة؛</li>
                <li style="margin-bottom: 8px;">تصديق جميع المستندات من وزارة الخارجية ووزارة العدل، وتسديد جميع رسوم التصديق ذات الصلة؛</li>
                <li style="margin-bottom: 8px;">فتح حساب بنكي وتفعيله باسم شركة ذات مسؤولية محدودة، وإيداع رأس المال، واستلام الشهادة البنكية التي تثبت إيداع رأس المال، والتوقيع على جميع المستندات اللازمة لذلك؛</li>
                <li style="margin-bottom: 8px;">تسديد كافة الرسوم اللازمة لتأسيس شركة الشخص وتسجيلها، وترتيب عمل ختم لها؛</li>
                <li style="margin-bottom: 8px;">فتح الملف للمنشاة، وتسجيل شركة ذات مسؤولية محدودة لدى وزارة التجارة ووزارة الاستثمار، والبلدية، وهيئة الزكاة والضريبة والجمارك، والمؤسسة العامة للتأمينات الاجتماعية، ومكتب العمل، وزارة الموارد البشرية والتنمية الاجتماعية</li>
                <li style="margin-bottom: 8px;">تحديث البيانات المتعلقة بالشركة ذات المسؤولية المحدودة لشخص او عدة اشخاص في المملكة العربية السعودية؛​ لدى وزارة التجارة، ووزارة الاستثمار، وكتابة العدل، ومكاتب السجل التجاري، وغرف التجارة والصناعة، والإمارات، والمحافظات، ووزارة العدل، ووزارة الخارجية، والبعثات الدبلوماسية، ووزارة المالية، وإدارة الجوازات،  والأحوال المدنية، والبلديات، والدفاع المدني، والمؤسسة العامة للتأمينات الاجتماعية، وهيئة الزكاة والضريبة والجمارك، ووزارة الموارد البشرية والتنمية الاجتماعية، ومكتب العمل، ومكتب الاستقدام، وكافة الوزارات والدوائر الحكومية الأخرى.</li>
                <li style="margin-bottom: 8px;">تقديم الطلبات والاستلام لاستخراج والتعديل والتجديد للرخص اللازمة لشركة ذات مسؤولية محدودة، وشهادة السجل التجاري من وزارة التجارة ووزارة الإستثمار، وشهادة الاشتراك في الغرفة التجارية، وشهادة البلدية، وشهادة المؤسسة العامة للتأمينات الاجتماعية، وشهادة هيئة الزكاة والضريبة والجمارك؛</li>
                <li style="margin-bottom: 8px;">القيام بأي إجراءات أخرى لازمة لتسجيل شركة ذات مسؤولية محدود لشخص او عدة اشخاص في المملكة العربية السعودية واستخراج التراخيص اللازمة للممارسة أغراض شركة ذات مسئولية محدودة</li>
                <li style="margin-bottom: 8px;">يحق للوكلاء تفويض كل أو بعض الصلاحيات المذكورة أعلاه للغير</li>
                <li style="margin-bottom: 8px;">يحق لهم الاستلام والتسليم.</li>
                <li>مراجعة جميع الجهات ذات العلاقة وإنهاء جميع الإجراءات اللازمة والتوقيع فيما يتطلب ذلك.</li>
              </ol>
            </div>
          </div>

          <!-- English Column -->
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid #3b82f6;">
            <h4 style="color: #3b82f6; margin-bottom: 20px; text-align: center; font-size: 18px;">Powers Granted (English)</h4>
            <div style="line-height: 1.8; font-size: 13px;">
              <p style="margin-bottom: 15px;">("Attorneys"), all Saudi nationals, as attorneys representing me, jointly and/or severally, in my capacity mentioned above and on behalf of the Company with regards to the establishment of a professional limited liability company for sole or multiple shareholder in compliance with the applicable laws in the Kingdom of Saudi Arabia. For this purpose, the Attorneys are authorized to do the following:</p>
              <ol style="padding-left: 20px;">
                <li style="margin-bottom: 8px;">to represent the Company before the Ministry of Commerce, Ministry of Investment, Notary Publics, Commercial Register Departments, Chambers of Commerce and Industry, principalities, provinces, Ministry of Justice, Ministry of Foreign Affairs, the diplomatic missions, Ministry of Finance, Department of Passports, Civil Affairs Department, municipalities, Civil Defense, General Organization of Social Insurance, Zakat, Tax and Customs Authority, Labour Office, Recruitment Office, Ministry of Human Resources and Social Development, and all other ministries and governmental authorities related to the incorporation for sole or multiple shareholder LLC in the Kingdom of Saudi Arabia;</li>
                <li style="margin-bottom: 8px;">to reserve the trade name of the Company according to the regulations that regulate the trade name reservation process in the Kingdom of Saudi Arabia;</li>
                <li style="margin-bottom: 8px;">to sign and submit all applications, forms, undertakings, declarations, amendments, explanations, statements, and any other documents to the relevant governmental authorities that may be required for the incorporation of for sole or multiple shareholder LLC;</li>
                <li style="margin-bottom: 8px;">to notarize and sign the company's articles of association, shareholders resolutions, and annexes amending the articles of association before the Notary Public, in addition to all other documents related to the amendment of the articles of association, and sign shareholders resolutions appointing the manager and/or board of managers and determining their powers;</li>
                <li style="margin-bottom: 8px;">to publish the summary of article of association, all notices and documents requested by the relevant governmental authorities in the Official Gazette or the local newspapers;</li>
                <li style="margin-bottom: 8px;">to attest all documents from the Ministry of Foreign Affairs, the Ministry of Justice and the embassies, and pay all relevant attestation fees;</li>
                <li style="margin-bottom: 8px;">to open bank account for the LLC, deposit the capital, obtain the capital deposit certificate, and sign all the required documents;</li>
                <li style="margin-bottom: 8px;">to pay all fees necessary for the incorporation and registration of the Sole Shareholder LLC and make the Sole Shareholder LLC's seal;</li>
                <li style="margin-bottom: 8px;">open file for the establishment , and register the LLC at the Ministry of Commerce, Ministry of Investment, Municipality, Zakat, Tax and Customs Authority, General Organization of Social Insurance, and the Labour Office, and the Ministry of Human Resources;</li>
                <li style="margin-bottom: 8px;">Updating the data that related to LLC. by one person or more in the kingdom of Saudi Arabia; with ministry of commerce, ministry of investment, the Notary public, commercial registration offices, chambers of commerce and industry, emirates, governorates, the ministry of justice, the ministry of foreign affairs, diplomatic missions, the ministry of finance, the directorate of passports, civil affairs, municipalities, the civil defense, the general organization for social insurance, the zakat, tax and customs authority, the ministry of human resources and social development, the labor office, the recruitment office, and all other ministries and government departments.</li>
                <li style="margin-bottom: 8px;">to submit applications, receive, amend and renew the license necessary for the LLC, Commercial Register from the Ministry of Commerce and Ministry of Investment, Chamber of Commerce Subscription Certificate, Municipality Certificate, General Organization of Social Insurance Certificate, and Zakat and Tax and Customs Authority Certificate;</li>
                <li style="margin-bottom: 8px;">to undertake any other procedure required for registering the LLC for sole or multiple share holder in the Kingdom of Saudi Arabia and obtaining licenses required for conducting the LLC's objects;</li>
                <li style="margin-bottom: 8px;">to delegate all or part of the above powers to any third party.</li>
                <li style="margin-bottom: 8px;">They have the right to receive and deliver.</li>
                <li>to follow up with all relevant authorities, complete all necessary procedures, and sign wherever required.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <!-- Signatures Section -->
      <div class="signatures-section" style="margin-bottom: 40px;">
        <h3 style="color: #1f2937; font-size: 20px; margin-bottom: 20px; position: relative; padding-bottom: 10px;">
          <span style="background: white; padding-right: 15px;">Signatures</span>
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #3b82f6, #1f2937);"></div>
        </h3>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center; border: 2px dashed #3b82f6;">
            <h4 style="color: #1f2937; margin-bottom: 20px;">Principal Signature</h4>
            <div style="height: 80px; border-bottom: 1px solid #ddd; margin-bottom: 15px;"></div>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">Name: {{clientFirstName}} {{clientLastName}}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #666;">Date: {{currentDate}}</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center; border: 2px dashed #1f2937;">
            <h4 style="color: #3b82f6; margin-bottom: 20px;">Witness/Notary</h4>
            <div style="height: 80px; border-bottom: 1px solid #ddd; margin-bottom: 15px;"></div>
            <p style="margin: 5px 0; font-size: 14px; color: #666;">Name: ________________________</p>
            <p style="margin: 5px 0; font-size: 14px; color: #666;">Date: ________________________</p>
          </div>
        </div>
      </div>

      <!-- Signature Text -->
      <div class="signature-text" style="margin-bottom: 40px; background: #f8fafc; padding: 25px; border-radius: 8px; border: 2px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 500;">حررت هذه الوكالة وصدقت في ____.</p>
          <p style="margin: 5px 0; font-size: 16px; color: #3b82f6; font-weight: 500;">This power of attorney is ratified and signed on _____.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div style="text-align: center;">
            <p style="margin-bottom: 10px; font-size: 14px; color: #666;">التوقيع:</p>
            <div style="height: 60px; border-bottom: 2px solid #1f2937; margin-bottom: 10px;"></div>
            <p style="margin: 0; font-size: 12px; color: #666;">Signature</p>
          </div>

          <div style="text-align: center;">
            <p style="margin-bottom: 10px; font-size: 14px; color: #666;">Signature:</p>
            <div style="height: 60px; border-bottom: 2px solid #3b82f6; margin-bottom: 10px;"></div>
            <p style="margin: 0; font-size: 12px; color: #666;">التوقيع</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffeaa7;">
          <p style="margin: 0; font-size: 12px; color: #856404; font-weight: 500;">[PLEASE NOTARIZE AT THE NOTARY PUBLIC AND AUTHENTICATE FROM THE MINISTRY OF FOREIGN AFFAIRS AND THE SAUDI CONSULATE IN THE COUNTRY OF ORIGIN OF THE SHAREHOLDERS]</p>
        </div>

        <div style="text-align: center; margin-top: 15px;">
          <p style="margin: 0; font-size: 12px; color: #666;">Page 1 of 4</p>
          <p style="margin: 0; font-size: 12px; color: #666;">Formation of a MISA licensed limited liability company/Draft POA/GPA/16 January 2025</p>
        </div>
      </div>

      <!-- Footer -->
      <footer class="poa-footer" style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 3px solid #3b82f6; position: relative;">
        <div style="position: absolute; top: -3px; left: 50%; transform: translateX(-50%); width: 200px; height: 6px; background: linear-gradient(90deg, #1f2937, #3b82f6); border-radius: 3px;"></div>
         <div class="company-stamp" style="margin-bottom: 25px; display: inline-block; padding: 15px; background: white; border-radius: 50%; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
           {{#if companyStamp}}
           <img src="{{companyStamp}}" alt="Company Stamp" style="max-width: 100px; max-height: 100px;" />
           {{/if}}
         </div>
        <h4 style="color: #1f2937; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">{{companyName}}</h4>
        <p style="font-size: 14px; color: #666; margin: 5px 0;">{{companyAddress}}</p>
        <p style="font-size: 14px; color: #666; margin: 5px 0;">{{companyPhone}} | {{companyEmail}}</p>
        <div style="margin-top: 20px; padding: 10px 20px; background: #f8fafc; border-radius: 20px; display: inline-block;">
          <p style="font-size: 12px; color: #1f2937; margin: 0; font-weight: 500;">Generated on: {{currentDate}}</p>
        </div>
      </footer>
    </div>
  `,
  placeholders: [
    {
      key: "companyRegistration",
      label: "Company Registration Number",
      type: "text",
      required: true,
    },

    {
      key: "nationality",
      label: "Nationality",
      type: "text",
      required: true,
    },
    {
      key: "capacity",
      label: "Capacity",
      type: "text",
      required: true,
    },
    {
      key: "passportNumber",
      label: "Passport Number",
      type: "text",
      required: true,
    },
    {
      key: "passportIssueDate",
      label: "Passport Issue Date",
      type: "date",
      required: true,
    },
    {
      key: "passportExpirationDate",
      label: "Passport Expiration Date",
      type: "date",
      required: true,
    },
    {
      key: "passportIssuePlace",
      label: "Passport Issue Place",
      type: "text",
      required: true,
    },
    {
      key: "attorneys",
      label: "Authorized Attorneys (JSON array)",
      type: "text",
      required: true,
    },
  ],
  tags: ["legal", "power-of-attorney", "bilingual", "arabic", "english"],
};
