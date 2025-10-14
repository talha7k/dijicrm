## Why

The application currently uses mock/hardcoded data in several stores, preventing real functionality and testing. This includes client management, invoices, payments, documents, templates, and metrics. Replacing mock data with actual Firebase integration will enable full CRUD operations, real-time updates, and proper data persistence.

## What Changes

- **BREAKING**: Replace mock data in clientManagement store with Firebase Firestore queries
- **BREAKING**: Replace mock data in clientInvoices store with Firebase queries
- **BREAKING**: Replace mock data in clientDocuments store with Firebase queries  
- **BREAKING**: Replace mock data in payments store with Firebase queries
- **BREAKING**: Replace mock data in documentTemplates store with Firebase queries
- **BREAKING**: Replace mock data in companyMetrics store with Firebase queries
- Add Firebase security rules for new collections
- Update API routes to use Firebase Admin SDK where needed
- Add proper error handling for Firebase operations

## Impact

- Affected specs: client-management, invoice-payment-management, document-templates, company-dashboard
- Affected code: All stores in src/lib/stores/ that currently use mock data
- Migration: Existing mock data will be lost; new installations will start with empty Firebase collections
