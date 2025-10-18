/**
 * Shared CSS utilities for document templates
 * Provides common styling patterns and utilities for consistent document appearance
 *
 * USAGE:
 * - Import this file in template generation/preview systems
 * - Use getDocumentStyles() to get base styles for specific document types
 * - Use commonDocumentStyles as a reference for creating new templates
 * - NOT for direct import into template HTML (styles should be internal to templates)
 */

export const commonDocumentStyles = `
  /* Base document styles */
  .document-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    background: white;
    color: #333;
    line-height: 1.6;
  }

  /* Header styles */
  .document-header {
    margin-bottom: 40px;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 30px;
  }

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 0 0 auto;
  }

  .header-center {
    flex: 1;
    text-align: center;
  }

  .header-right {
    flex: 0 0 auto;
    text-align: right;
  }

  /* Company info styles */
  .company-info h2 {
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 15px 0;
  }

  .company-info p {
    margin: 5px 0;
    font-size: 14px;
    color: #6b7280;
  }

  /* Billing info styles */
  .billing-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-bottom: 40px;
  }

  .info-section {
    background: #f8fafc;
    padding: 25px;
    border-radius: 12px;
    border-left: 4px solid #2563eb;
  }

  .info-section h3 {
    font-size: 16px;
    font-weight: 600;
    color: #2563eb;
    margin: 0 0 15px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .info-section p {
    margin: 8px 0;
    font-size: 14px;
    color: #4b5563;
  }

  /* Table styles */
  .document-table {
    width: 100%;
    border-collapse: collapse;
    margin: 30px 0;
    background: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    overflow: hidden;
  }

  .document-table thead {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
  }

  .document-table th {
    padding: 20px 15px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: none;
  }

  .document-table th:first-child {
    border-top-left-radius: 12px;
    width: 40%;
  }

  .document-table th:last-child {
    border-top-right-radius: 12px;
    text-align: right;
  }

  .document-table tbody tr {
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.2s ease;
  }

  .document-table tbody tr:hover {
    background-color: #f8fafc;
  }

  .document-table tbody tr:last-child {
    border-bottom: none;
  }

  .document-table td {
    padding: 18px 15px;
    font-size: 14px;
    color: #374151;
    border: none;
  }

  .document-table td:last-child {
    text-align: right;
    font-weight: 600;
    color: #1f2937;
  }

  .document-table tbody tr:nth-child(even) {
    background-color: #fafbfc;
  }

  /* Totals styles */
  .document-totals {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-top: 40px;
    background: #f8fafc;
    padding: 30px;
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    min-width: 300px;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 8px 0;
    font-size: 14px;
    color: #4b5563;
  }

  .total-row.total {
    border-top: 2px solid #2563eb;
    margin-top: 15px;
    padding-top: 20px;
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }

  .total-row span:first-child {
    flex: 1;
    text-align: left;
  }

  .total-row span:last-child {
    flex: 0 0 auto;
    text-align: right;
    min-width: 100px;
  }

  /* Footer styles */
  .document-footer {
    margin-top: 50px;
    padding-top: 30px;
    border-top: 2px solid #e5e7eb;
    background: linear-gradient(to bottom, #f8fafc, white);
    padding: 40px 20px;
    border-radius: 0 0 12px 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 40px;
  }

  .footer-left {
    flex: 0 0 auto;
    text-align: center;
  }

  .footer-right {
    flex: 1;
    text-align: left;
  }

  .footer-right p {
    margin: 10px 0;
    color: #6b7280;
    font-size: 14px;
  }

  .thank-you-message {
    font-size: 18px;
    font-weight: 600;
    color: #2563eb;
    margin-bottom: 20px;
  }

  /* Image styles */
  .company-logo img {
    max-width: 200px;
    max-height: 100px;
    object-fit: contain;
  }

  .company-stamp img {
    max-width: 150px;
    max-height: 150px;
    object-fit: contain;
    opacity: 0.8;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px;
    background: white;
  }

  .zatca-qr-code {
    width: 100px;
    height: 100px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 5px;
    background: white;
  }

  .zatca-qr-code img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* Responsive styles */
  @media (max-width: 768px) {
    .document-container {
      padding: 20px 10px;
    }

    .header-section {
      flex-direction: column;
      text-align: center;
      gap: 20px;
    }

    .header-right {
      text-align: center;
    }

    .billing-info {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .document-table {
      font-size: 12px;
    }

    .document-table th,
    .document-table td {
      padding: 12px 8px;
    }

    .document-totals {
      min-width: auto;
      width: 100%;
    }

    .document-footer {
      flex-direction: column;
      text-align: center;
    }

    .footer-right {
      text-align: center;
    }
  }

  /* Print styles */
  @media print {
    .document-container {
      padding: 0;
      max-width: none;
      box-shadow: none;
    }

    .zatca-qr-code {
      border: 1px solid #000;
    }

    .document-table {
      box-shadow: none;
    }

    .document-header {
      page-break-after: avoid;
    }

    .billing-info {
      page-break-inside: avoid;
    }

    .document-table {
      page-break-inside: avoid;
    }

    .document-totals {
      page-break-inside: avoid;
    }

    .document-footer {
      page-break-inside: avoid;
    }
  }
`;

/**
 * Get styles for a specific document type
 */
export function getDocumentStyles(type: string): string {
  switch (type) {
    case "order":
      return commonDocumentStyles;
    case "legal":
      return `
        ${commonDocumentStyles}
        /* Additional legal document styles */
        .legal-header { margin-bottom: 40px; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .party { flex: 1; }
        .contract-body { margin-bottom: 40px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
      `;
    case "business":
      return `
        ${commonDocumentStyles}
        /* Additional business document styles */
        .business-header { margin-bottom: 30px; }
        .executive-summary { margin-bottom: 30px; }
        .recommendations { margin-bottom: 30px; }
      `;
    default:
      return commonDocumentStyles;
  }
}
