## Why

The current template creation uses a dialog which limits functionality, dropdown selects are not updating values properly, there's a Firebase initialization error, invoice creation only allows draft status, and there's a 500 error on specific invoice pages. These issues hinder user experience and functionality.

## What Changes

- Change template creation from dialog to a dedicated page with sample templates displayed
- Fix dropdown select components to properly update values using shadcn/svelte
- Fix Firebase app initialization error in firebaseStorage.ts
- Add status selection options (draft, quote, etc.) when creating invoices
- Fix 500 error on invoice detail pages

## Impact

- Affected specs: document-templates, invoice-payment-management
- Affected code: template creation components, select components, firebaseStorage.ts, invoice creation forms, invoice detail pages
