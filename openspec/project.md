# Project Context

## Purpose

Dijicrm is a multi-dashboard portal for clients and companies to manage invoices. This CRM system provides separate dashboards for client access and company administration, featuring invoice management, billing, notifications, and account settings. The goal is to streamline client relationship management and financial operations for businesses of all sizes.

## Tech Stack

- **Frontend Framework**: SvelteKit (v2.44.0) with Svelte 5 (v5.39.9)
- **Styling**: Tailwind CSS (v4.1.14) with Shadcn/Svelte (v1.8.0) components
- **Backend/Database**: Firebase (v12.3.0) for authentication, Firestore, and storage
- **Language**: TypeScript (v5.9.3)
- **Build Tool**: Vite
- **Deployment**: Optimized for serverless deployment (Vercel/Firebase Hosting)

## Project Conventions

### Code Style

- Use TypeScript for all code with strict type checking
- Follow Svelte component naming conventions (PascalCase for components)
- Use kebab-case for file names (e.g., `invoice-list.svelte`)
- Import statements: Group by type (external libraries, then internal modules)
- Use Prettier for code formatting with default settings
- Always use variables instead of hard-coded values (colors, strings, etc. should be in config or constants)
- Component props use `let { prop = default } = $props();` syntax for Svelte 5 runes
- **Always use Shadcn/Svelte UI components instead of raw HTML elements** - Never use native `<select>`, `<input>`, `<button>`, etc. directly

### Architecture Patterns

- **Rendering Strategy**: Server-Side Rendering (SSR) for initial page loads and SEO, Client-Side Rendering (CSR) for dynamic interactions
- **Data Fetching**: Isolate all Firebase data operations into custom Svelte hooks (e.g., `useInvoices()`, `useClients()`)
- **API Routes**: Use SvelteKit API routes (`+server.ts`) for server-side data operations and external API integrations
- **State Management**: Use Svelte stores for global state, Firebase real-time listeners for reactive data
- **Component Structure**: Separate UI components (Shadcn), business logic components, and page components
- **File Organization**: Group by feature (e.g., `lib/components/app/invoices/`) rather than by type
- **Authentication**: Role-based access with protected routes using auth guards
- **Error Handling**: Centralized error handling with user-friendly messages

### Testing Strategy

- Unit tests for utility functions and hooks using Vitest
- Component testing with @testing-library/svelte
- Integration tests for API routes
- E2E testing with Playwright for critical user flows
- Aim for 80%+ code coverage on business logic
- Run tests on every commit via CI/CD

### Git Workflow

- Use GitHub Flow: main branch for production, feature branches for development
- Branch naming: `feature/description`, `bugfix/issue-number`
- Commit messages: Use conventional commits (e.g., `feat: add invoice creation`, `fix: resolve payment calculation bug`)
- Pull requests required for all changes with code review
- Squash merges to keep history clean

## Domain Context

This is a CRM (Customer Relationship Management) system focused on invoice and billing management. Key concepts:

- **Clients**: Business customers who receive invoices
- **Companies**: The businesses using Dijicrm to manage their operations
- **Invoices**: Financial documents with line items, taxes, due dates, and payment status
- **Dashboards**: Separate interfaces for clients (view invoices) and admins (full management)
- **Notifications**: Automated alerts for overdue payments, new invoices, etc.
- Business workflows include invoice creation, client onboarding, payment tracking, and financial reporting

## Important Constraints

- Must comply with financial data security standards (PCI DSS considerations for payment processing)
- Firebase plan limitations (read/write quotas, storage limits)
- Responsive design required for mobile and desktop
- Real-time updates needed for collaborative features
- Multi-tenant architecture to support multiple companies
- GDPR/CCPA compliance for client data handling

## External Dependencies

- **Firebase**: Primary backend for authentication, database (Firestore), and file storage
- **Stripe/Payment Processors**: For payment processing (future integration)
- **Email Services**: For notifications and invoice delivery (SendGrid/Mailgun)
- **Analytics**: Google Analytics or similar for usage tracking
- **CDN**: For static asset delivery and performance optimization
