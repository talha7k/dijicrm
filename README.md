# TK-Crm

A multi-dashboard portal for clients and companies to manage invoices. Built with SvelteKit and Firebase, this CRM system provides separate dashboards for client access and company administration, featuring invoice management, billing, notifications, and account settings.

## Features

- 🔥 Firebase Authentication
- 📊 Multi-dashboard system (Client & Company)
- 💳 Invoice management and billing with payment tracking
- 📄 Automated document generation and delivery
- 👥 Client relationship management
- 🔔 Notification system
- 🎨 Styling with Shadcn/Svelte
- 🛡️ Protected routes with auth guards
- 📱 Responsive design
- 📄 Pre-built marketing pages (Home, Features, Pricing, Contact)
- 🔒 Authentication flows (Sign in, Sign up, Forgot password)

## How It Works

TK-Crm provides a comprehensive business management system with integrated workflows for invoices, payments, documents, and client relationships. Here's how the key business flows work:

### 📋 Invoice & Business Case Management

1. **Creating Invoices**: Company users create invoices by selecting products/services and assigning them to clients. Each invoice becomes a "Business Case" that tracks the entire client relationship.

2. **Invoice Status Flow**:
   - `draft`: Invoice created but not yet sent
   - `sent`: Invoice delivered to client
   - `partially_paid`: Some payment received, outstanding balance remains
   - `paid`: Invoice fully paid
   - `overdue`: Past due date with outstanding balance

3. **Automatic Document Generation**: When an invoice is sent, the system automatically generates required documents (contracts, invoices, etc.) based on document requirements configured for each product.

### 💰 Payment Management

1. **Recording Payments**: Company users can record payments against invoices with full details including payment method, reference numbers, and notes.

2. **Payment Tracking**: Each business case tracks:
   - Total amount
   - Amount paid
   - Outstanding balance
   - Payment history with timestamps

3. **Automatic Status Updates**: Invoice status automatically transitions based on payment activity:
   - Outstanding balance = 0 → `paid`
   - Partial payment received → `partially_paid`

### 📄 Document Generation & Delivery

1. **Document Requirements**: Products can have mandatory or optional documents that must be generated when creating business cases.

2. **Template System**: Documents are generated from HTML templates with placeholder replacement (client name, amounts, dates, etc.).

3. **Automated Delivery**: Generated documents are automatically emailed to clients, with delivery status tracking.

4. **Document History**: All document versions and delivery attempts are tracked for audit purposes.

### 👥 Client Management

1. **Client Invitation**: Companies can invite clients via email to create accounts.

2. **Client Status Flow**:
   - `invited`: Email sent, account not yet activated
   - `active`: Client has activated account and can access their dashboard

3. **Client Dashboard**: Active clients can view their invoices, download documents, and track payment status.

### 🔄 Integrated Workflows

**Company Workflow**:

1. Create/select client
2. Create invoice with products
3. System generates required documents
4. Send invoice and documents to client
5. Record payments as received
6. Track outstanding balances

**Client Workflow**:

1. Receive invitation email
2. Activate account
3. View invoices and documents
4. Download required paperwork
5. Make payments (future feature)

**Dashboard Integration**:

- Company dashboard shows metrics: total invoices, outstanding amounts, active clients, overdue invoices
- Recent activity feed tracks all business events
- Payment activity is highlighted in company metrics

## Tech Stack

- **Svelte**: 5.39.9
- **Tailwind CSS**: 4.1.14
- **Shadcn/Svelte** (bits-ui): 1.8.0
- **SvelteKit**: 2.44.0
- **Firebase**: 12.3.0
- **TypeScript**: 5.9.3

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or npm
- Firebase project

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/talha7k/tk-crm.git
   cd tk-crm
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication service and select your preferred providers
   - Create a `.env` file in the root directory:

   ```env
   PUBLIC_FIREBASE_API_KEY=your_api_key
   PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm dev
   ```

## Project Structure

```
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── app/       # Application-specific components (account, billing, nav, notifications)
│   │   │   ├── auth/      # Authentication components
│   │   │   ├── marketing/ # Marketing page components
│   │   │   ├── shared/    # Shared utility components (payment forms, document viewers, etc.)
│   │   │   └── ui/        # Shadcn/Svelte UI components
│   │   ├── hooks/         # Svelte hooks (usePayments, useCompanyMetrics, etc.)
│   │   ├── schemas/       # Validation schemas
│   │   ├── services/      # External service integrations (email, Firebase storage)
│   │   ├── stores/        # Svelte stores
│   │   ├── types/         # TypeScript type definitions (Payment, BusinessCase, etc.)
│   │   └── utils.ts       # Utility functions
│   ├── routes/
│   │   ├── (app)/        # Protected application routes
│   │   │   ├── dashboard/ # Company dashboard with metrics
│   │   │   ├── invoices/  # Invoice management (create, list, detail)
│   │   │   ├── clients/   # Client relationship management
│   │   │   ├── billing/   # Billing and subscription management
│   │   │   └── account/   # User account settings
│   │   ├── (auth)/       # Authentication pages
│   │   ├── (marketing)/  # Marketing pages (home, features, pricing, contact, blog)
│   │   ├── api/          # API routes for document generation/delivery
│   │   └── +layout.svelte # Root layout
│   └── posts/             # Blog posts (MDsveX)
├── static/                # Static assets
├── openspec/              # OpenSpec change proposals and specifications
└── svelte.config.js       # Svelte configuration
```

## Authentication

The system includes pre-built authentication flows with role-based access:

- Sign In (`/auth/signin`)
- Sign Up (`/auth/signup`)
- Forgot Password (`/auth/forgot-password`)

Protected routes are handled by auth guards, providing separate dashboards for clients and company administrators. Client dashboards focus on invoice viewing and payment, while company dashboards include full management capabilities.

### Using Protected Routes

```typescript
// src/routes/app/+layout.ts
import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import { getUser } from "$lib/firebase/auth";

export const load: LayoutLoad = async ({ url }) => {
  const user = await getUser();

  if (!user) {
    throw redirect(307, `/auth/signin?redirect=${url.pathname}`);
  }

  return { user };
};
```

## ShadcN Components

The template uses ShadcN for UI components. Import components from `$lib/components/ui`:

```svelte
<script>
  import { Button } from '$lib/components/ui/button';
</script>

<Button variant="default">Click me</Button>
```

## Svelte FireKit Integration

The template uses Svelte FireKit for Firebase integration. Common operations:

### Authentication

```typescript
import { firekitAuth } from "svelte-firekit";

// Sign in
await firekitAuth.signInWithEmail(email, password);

// Register
await firekitAuth.registerWithEmail(email, password, displayName);

// Sign out
await firekitAuth.logOut();

// Send password reset
await firekitAuth.sendPasswordReset(email);
```

## Deployment

1. Build the application:
   ```bash
   npm build
   ```

## Development Workflow

This project uses OpenSpec for managing feature development and architectural changes:

- **Change Proposals**: Major features start with a proposal in `openspec/changes/`
- **Specifications**: Detailed specs define requirements and implementation approach
- **Task Tracking**: Implementation tasks are tracked in proposal task files
- **Validation**: Changes are validated against OpenSpec guidelines

See `openspec/AGENTS.md` for detailed guidelines on creating and implementing changes.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
