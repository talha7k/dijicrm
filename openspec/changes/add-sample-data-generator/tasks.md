## 1. Create Sample Data Generator API

- [x] 1.1 Create `/api/sample-data/+server.ts` endpoint with POST handler
- [x] 1.2 Set up Firebase Admin SDK initialization in server context
- [x] 1.3 Implement sample company data generation with branding settings
- [x] 1.4 Implement sample client data generation with authentication accounts
- [x] 1.5 Implement sample products/services data generation
- [x] 1.6 Implement sample document templates data generation
- [x] 1.7 Implement sample invoices data generation with proper relationships
- [x] 1.8 Implement sample payments data generation
- [x] 1.9 Add progress tracking and error handling to the generator
- [x] 1.10 Add environment checks to prevent production data generation

## 2. Add Sample Data Button to Settings Page

- [x] 2.1 Add "Data Management" section to settings page
- [x] 2.2 Add "Generate Sample Data" button with confirmation dialog
- [x] 2.3 Implement client-side API call to sample data endpoint
- [x] 2.4 Add loading states and progress feedback during generation
- [x] 2.5 Add success/error message handling and display

## 3. Remove Mock Data from Components

- [x] 3.1 Remove mock invoice data from `/invoices/+page.svelte`
- [x] 3.2 Remove mock invoice data from `/invoices/[id]/+page.svelte`
- [x] 3.3 Remove mock client data from `/invite/[token]/+page.svelte`
- [x] 3.4 Update components to show proper loading states
- [x] 3.5 Update components to show empty states with helpful messages

## 4. Update Component Empty States

- [x] 4.1 Update invoices list to show "No invoices yet" with sample data suggestion
- [x] 4.2 Update invoice detail page to handle missing invoice gracefully
- [x] 4.3 Update client management to show empty state appropriately
- [x] 4.4 Add links to settings page for generating sample data

## 5. Testing and Validation

- [x] 5.1 Test sample data generation in development environment
- [x] 5.2 Verify all generated data relationships are correct
- [x] 5.3 Test error handling and partial failure scenarios
- [x] 5.4 Update existing tests to work without mock data
- [x] 5.5 Add tests for the sample data generator API
