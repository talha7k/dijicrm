## Why

The current client management flow only supports invitation-based client creation, which limits flexibility for companies that need to add clients directly without requiring portal access initially. Companies need both direct client addition for administrative purposes and invitation capabilities for granting portal access later.

## What Changes

- Change main client page button from 'Invite Client' to 'Add Client' and update messaging
- Repurpose /clients/create page from invitation flow to client addition flow
- Add separate addClient() method in store for creating clients without invitations
- Add invite functionality for existing clients who need portal access
- Update client management UI to distinguish between added and invited clients

## Impact

- Affected specs: company-dashboard
- Affected code:
  - src/routes/(app)/clients/+page.svelte
  - src/routes/(app)/clients/create/+page.svelte
  - src/lib/stores/clientManagement.ts
  - Client detail pages will need invite functionality
