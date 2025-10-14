## 1. Template Creation Page

- [x] 1.1 Create new route for template creation (/templates/create)
- [x] 1.2 Move template creation logic from dialog to page component
- [x] 1.3 Add sample templates section to the creation page
- [x] 1.4 Update navigation to use new page instead of dialog

## 2. Fix Dropdown Selects

- [x] 2.1 Research shadcn/svelte select usage via Context7
- [x] 2.2 Identify all select components with update issues
- [x] 2.3 Update select components to properly bind values
- [x] 2.4 Test select functionality across forms

## 3. Fix Firebase Initialization

- [x] 3.1 Check firebaseStorage.ts for initialization issues
- [x] 3.2 Ensure Firebase app is properly initialized before use
- [x] 3.3 Test Firebase storage operations

## 4. Invoice Status Options

- [x] 4.1 Add status dropdown to invoice creation form
- [x] 4.2 Implement status options (draft, quote, sent, paid, etc.)
- [x] 4.3 Update invoice creation logic to handle status
- [x] 4.4 Update invoice display to show status

## 5. Fix Invoice 500 Error

- [x] 5.1 Investigate 500 error on /invoices/INV-002
- [x] 5.2 Check server-side loading and error handling
- [x] 5.3 Fix any data fetching or rendering issues
- [x] 5.4 Test invoice detail pages
