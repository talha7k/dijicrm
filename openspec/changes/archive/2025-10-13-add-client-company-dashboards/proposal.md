## Why

The current system has a placeholder dashboard that doesn't provide meaningful functionality for either clients or companies. Clients need a dedicated interface to view their invoices and billing information, while companies need an administrative dashboard to manage their operations, clients, and invoices.

## What Changes

- Add a client dashboard at `/client-dashboard` route for authenticated clients to view their invoices, payment history, and account information
- Add a company dashboard at `/dashboard` route (enhancing the existing placeholder) for company administrators to manage clients, invoices, billing, and system settings
- Implement role-based routing to direct users to appropriate dashboards based on their authentication role

## Impact

- Affected specs: client-dashboard, company-dashboard
- Affected code: New routes and components in `src/routes/(app)/`, authentication guards, dashboard components
- No breaking changes to existing functionality
