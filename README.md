# Dijicrm

A multi-dashboard portal for clients and companies to manage invoices. Built with SvelteKit and Firebase, this CRM system provides separate dashboards for client access and company administration, featuring invoice management, billing, notifications, and account settings.

## Features

- 🔥 Firebase Authentication
- 📊 Multi-dashboard system (Client & Company)
- 💳 Invoice management and billing
- 🔔 Notification system
- 🎨 Styling with Shadcn/Svelte
- 🛡️ Protected routes with auth guards
- 📱 Responsive design
- 📄 Pre-built marketing pages (Home, Features, Pricing, Contact)
- 🔒 Authentication flows (Sign in, Sign up, Forgot password)

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
   git clone https://github.com/talha7k/dijicrm.git
   cd dijicrm
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
│   │   │   ├── shared/    # Shared utility components
│   │   │   └── ui/        # Shadcn/Svelte UI components
│   │   ├── hooks/         # Svelte hooks
│   │   ├── schemas/       # Validation schemas
│   │   ├── stores/        # Svelte stores
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils.ts       # Utility functions
│   ├── routes/
│   │   ├── (app)/        # Protected application routes (dashboard, billing, account, notifications)
│   │   ├── (auth)/       # Authentication pages
│   │   ├── (marketing)/  # Marketing pages (home, features, pricing, contact, blog)
│   │   ├── api/          # API routes
│   │   └── +layout.svelte # Root layout
│   └── posts/             # Blog posts (MDsveX)
├── static/                # Static assets
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

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
