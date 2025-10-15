# TK-Crm Project Conventions

## 1. Purpose

TK-Crm is a multi-dashboard portal for clients and companies to manage invoices. This CRM system provides separate dashboards for client access and company administration, featuring invoice management, billing, notifications, and account settings. The goal is to streamline client relationship management and financial operations for businesses of all sizes.

## 2. Tech Stack

- **Frontend Framework**: SvelteKit (v2.44.0) with Svelte 5 (v5.39.9)
- **Styling**: Tailwind CSS (v4.1.14) with Shadcn/Svelte (v1.8.0) components
- **Backend/Database**: Firebase (v12.3.0) for authentication, Firestore, and storage
- **Language**: TypeScript (v5.9.3)
- **Build Tool**: Vite
- **Deployment**: Optimized for serverless deployment (Vercel/Firebase Hosting)

## 3. Project Conventions

### Code Style

- Use TypeScript for all code with strict type checking.
- Follow Svelte component naming conventions (PascalCase for components).
- Use kebab-case for file names (e.g., `invoice-list.svelte`).
- Group import statements by type (external libraries, then internal modules).
- Use Prettier for code formatting with default settings.
- Store all hard-coded values (colors, strings, etc.) in a centralized configuration or constants file.
- Use the `let { prop = default } = $props();` syntax for Svelte 5 runes in component props.
- Always use Shadcn/Svelte UI components instead of raw HTML elements. Never use native `<select>`, `<input>`, or `<button>` directly.
- Always use theme colors from CSS custom properties (e.g., `hsl(var(--primary))`) instead of hardcoded color values. Never use raw hex codes, RGB values, or color names directly in components.
- Use the standardized `Loading` component (`$lib/components/ui/loading/loading.svelte`) for all loading states instead of custom spinners. It provides consistent styling with border animation and supports different sizes and messages.
- Centralize common operations like date formatting and string manipulation in utility functions within `$lib/utils.ts` to reduce code duplication.

### Architecture Patterns

#### Rendering Strategy

Server-Side Rendering (SSR) for initial page loads and SEO, with Client-Side Rendering (CSR) for dynamic interactions.

#### Data Fetching Strategy

A clear separation between server-side and client-side data fetching is crucial.

**Quick Guide:**

- **Server-Side** (`+page.server.ts`): Use for data needed on initial page load (essential for SEO & performance).
- **Client-Side** (via `+server.ts` API routes): Use for data loaded by user interactions (searching, filtering, forms) after the page is visible.

#### Server-Side Fetching (+page.server.ts)

**When to use:** For fetching the initial data required to render a page. Use this for fetching lists of invoices, client details, or any data needed on the first paint.

**How it works:** Data is fetched in the load function on the server before the page is sent to the client. This data is then available to the +page.svelte component via the data prop.

**Security:** All server-side fetches should use the Firebase Admin SDK for secure access to the database, respecting security rules and keeping secrets off the client.

#### Client-Side Fetching (in .svelte files)

**When to use:** For data that is not critical for the initial render, is highly dynamic, or is loaded in response to user interaction (e.g., searching, filtering, pagination, form submissions).

**How it works:** Use the browser's fetch API from within component lifecycle functions (like onMount) or custom hooks to call SvelteKit API Routes (+server.ts).

#### API Routes (+server.ts)

**Purpose:** These are the dedicated endpoints for your client-side logic. They act as a secure backend layer. Any action that needs to modify data (create, update, delete) from the client should go through an API route.

**Example:** A client-side "Delete Invoice" button would call fetch on a DELETE /api/invoices/[id] endpoint, which would be handled by a src/routes/api/invoices/[id]/+server.ts file.

#### State Management

All stores must be centralized in src/lib/stores/. Use Svelte stores for global state with Firebase real-time listeners for reactive data.

#### Hooks Usage

Use custom hooks for client-side data fetching, caching, and reactive state derived from stores.
Never use hooks to create or return stores. Stores should be imported directly from src/lib/stores/.

#### File & Folder Structure

A clear, feature-based folder structure is essential for maintainability.

- **src/routes**: Defines the application's pages and API endpoints.
  - Use layout groups (groupName) to apply different layouts without affecting the URL (e.g., (app) for authenticated routes).
  - Data for pages should be loaded in +page.server.ts for server-side rendering.

- **src/lib**: Contains all reusable application code.
  - **lib/components**: All Svelte components reside here, organized into subdirectories:
    - **app/**: Components specific to a business feature (e.g., invoices, clients). Example: lib/components/app/invoices/InvoiceDataTable.svelte.
    - **shared/**: Components that are reusable across multiple features but are specific to this application. Example: lib/components/shared/ConfirmationModal.svelte.
    - **ui/**: Base UI components, primarily for housing the Shadcn/Svelte components.
  - **lib/server**: Server-side only modules. This is where the Firebase Admin SDK should be initialized. SvelteKit prevents code in this directory from being exposed to the client.
  - **lib/stores**: Centralized location for all Svelte stores.
  - **lib/utils.ts**: Global utility functions (e.g., formatDate, cn).
  - **lib/constants**: Application-wide constants (e.g., route paths, configuration values).

#### Authentication

Implement role-based access control with protected routes using auth guards.

#### Error Handling

Centralize error handling to provide user-friendly messages and simplify debugging.

#### Testing Strategy

- Write unit tests for utility functions and hooks using Vitest.
- Use @testing-library/svelte for component testing.
- Create integration tests for API routes.
- Develop E2E tests for critical user flows with Playwright.
- Aim for at least 80% code coverage on business logic.
- Automate testing on every commit via CI/CD pipelines.

## 4. Domain Context

This CRM system focuses on invoice and billing management with the following key concepts:

- **Clients**: Business customers who receive invoices.
- **Companies**: Businesses using TK-Crm to manage their operations.
- **Invoices**: Financial documents with line items, taxes, due dates, and payment status.
- **Dashboards**: Separate interfaces for clients to view invoices and admins for full management.
- **Notifications**: Automated alerts for overdue payments, new invoices, and other important events.

## 5. Important Constraints

- Be mindful of Firebase plan limitations (read/write quotas, storage limits).
- Ensure responsive design for both mobile and desktop devices.
- Build a multi-tenant architecture to support multiple companies.

## 6. External Dependencies

- **Firebase**: Primary backend for authentication, database (Firestore), and file storage.
- **Email Services**: For sending notifications and invoices via SMTP.
- **Analytics**: Google Analytics or a similar tool for usage tracking.
