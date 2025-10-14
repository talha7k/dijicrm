## 1. Create Sample Data Generator API

- [ ] 1.1 Create `/api/sample-data/+server.ts` endpoint with POST handler
- [ ] 1.2 Set up Firebase Admin SDK initialization in server context
- [ ] 1.3 Implement sample company data generation with branding settings
- [ ] 1.4 Implement sample client data generation with authentication accounts
- [ ] 1.5 Implement sample products/services data generation
- [ ] 1.6 Implement sample document templates data generation
- [ ] 1.7 Implement sample invoices data generation with proper relationships
- [ ] 1.8 Implement sample payments data generation
- [ ] 1.9 Add progress tracking and error handling to the generator
- [ ] 1.10 Add environment checks to prevent production data generation

## 2. Add Sample Data Button to Settings Page

- [ ] 2.1 Add "Data Management" section to settings page
- [ ] 2.2 Add "Generate Sample Data" button with confirmation dialog
- [ ] 2.3 Implement client-side API call to sample data endpoint
- [ ] 2.4 Add loading states and progress feedback during generation
- [ ] 2.5 Add success/error message handling and display

## 3. Remove Mock Data from Components

- [ ] 3.1 Remove mock invoice data from `/invoices/+page.svelte`
- [ ] 3.2 Remove mock invoice data from `/invoices/[id]/+page.svelte`
- [ ] 3.3 Remove mock client data from `/invite/[token]/+page.svelte`
- [ ] 3.4 Update components to show proper loading states
- [ ] 3.5 Update components to show empty states with helpful messages

## 4. Update Component Empty States

- [ ] 4.1 Update invoices list to show "No invoices yet" with sample data suggestion
- [ ] 4.2 Update invoice detail page to handle missing invoice gracefully
- [ ] 4.3 Update client management to show empty state appropriately
- [ ] 4.4 Add links to settings page for generating sample data

## 5. Testing and Validation

- [ ] 5.1 Test sample data generation in development environment
- [ ] 5.2 Verify all generated data relationships are correct
- [ ] 5.3 Test error handling and partial failure scenarios
- [ ] 5.4 Update existing tests to work without mock data
- [ ] 5.5 Add tests for the sample data generator API
