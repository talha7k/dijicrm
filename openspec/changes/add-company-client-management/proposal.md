## Why

Companies need the ability to proactively manage their client relationships, including creating client accounts before the client signs up themselves. This enables companies to prepare invoices, documents, and communications in advance, improving operational efficiency and client experience. Currently, clients must sign up first, creating a bottleneck in the business process.

## What Changes

- **Client Management Interface**: Company users can view, create, edit, and manage all client accounts
- **Proactive Client Creation**: Companies can create client accounts with basic information without requiring client signup
- **Client Invitation System**: Send invitations to clients to complete their account setup
- **Client Status Tracking**: Track client account status (invited, active, inactive)
- **Enhanced Invoice Targeting**: Create invoices for any managed client, regardless of signup status

## Impact

- Affected specs: client-management (new capability), company-dashboard (enhanced)
- Affected code: New client management pages, enhanced company dashboard, invitation system, client data models
- New dependencies: Email service for invitations, enhanced authentication flow
