## Why

The application currently uses mock data in various components, which hinders proper testing and development with real Firebase data. Having mock data scattered throughout the codebase makes it difficult to transition to production and can lead to inconsistencies. A centralized server-side sample data generator would allow developers and users to populate the database with realistic test data without cluttering the client-side code.

## What Changes

- Remove mock data from all components and replace with proper loading states or empty states
- Add a server-side API endpoint that generates comprehensive sample data (companies, clients, invoices, products, templates, etc.)
- Add a "Generate Sample Data" button on the company settings page
- Update components to handle cases where no data exists yet

## Impact

- Affected specs: company-dashboard
- Affected code: All components currently using mock data, settings page, new API route
- Benefits: Cleaner codebase, easier testing, better user experience for new installations
