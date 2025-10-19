<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

### Development Rules

- **NO BUILDS**: Never run `npm run build`, `bun run build`, or similar unless explicitly requested
- **NO RUNS**: Never start development servers (`npm run dev`, `bun run dev`) unless explicitly requested
- **COMMIT CONTROLS**: Do not run git commands (`git add`, `git commit`, `git push`) automatically; only execute when explicitly requested by the user
- **USE BUN**: Always use `bun` instead of `npm` for package management
- **CHECK OFTEN**: Run `bun check` frequently to validate TypeScript and catch errors early
- **NO LINTING**: Never run the linter (`bun run lint`, `eslint`, etc.) as it messes up quotes and creates errors
- **THEME COLORS**: Always use theme colors from the design system rather than hardcoded color values
- **LOADING STATES**: Always implement proper loading states using `@src/lib/components/ui/loading/**` for consistent UI experience
- **SERVER FETCHING**: Avoid calling data fetching logic in components; use server-side files (load functions) for data fetching as this is a SvelteKit project
- **API STRUCTURE**: Use `@src/routes/api/**` for API endpoints following SvelteKit's file-based routing structure with +server.ts files
- **SVELTEKIT STRUCTURE**: Follow SvelteKit best practices for folder structure: routes/ for pages and API endpoints, lib/ for reusable components/utils, stores/ for state management, and app.html for root template
- **TYPESCRIPT**: Use TypeScript for all code with strict type checking
- **COMPONENT NAMING**: Follow Svelte component naming conventions (PascalCase for components)
- **FILE NAMING**: Use kebab-case for file names (e.g., `invoice-list.svelte`)
- **IMPORT GROUPING**: Group import statements by type (external libraries, then internal modules)
- **CODE FORMATTING**: Use Prettier for code formatting with default settings
- **CENTRALIZED VALUES**: Store all hard-coded values (colors, strings, etc.) in a centralized configuration or constants file
- **SVELTE 5 RUNES**: Use the `let { prop = default } = $props();` syntax for Svelte 5 runes in component props
- **SHADCN COMPONENTS**: Always use Shadcn/Svelte UI components instead of raw HTML elements. Never use native `<select>`, `<input>`, or `<button>` directly
- **THEME COLORS EXCLUSIVE**: Always use theme colors from CSS custom properties (e.g., `hsl(var(--primary))`) instead of hardcoded color values. Never use raw hex codes, RGB values, or color names directly in components
- **UTILS CENTRALIZATION**: Centralize common operations like date formatting and string manipulation in utility functions within `$lib/utils.ts` to reduce code duplication
- **DATA FETCHING**: Use server-side fetching (+page.server.ts) for initial page load data; use client-side fetching (API routes) for user interactions after page load
- **STORE MANAGEMENT**: All stores must be centralized in src/lib/stores/; use Svelte stores for global state with Firebase real-time listeners for reactive data
- **PERSISTED STORES**: After database operations, either update cached data directly in stores for immediate UI updates or call refresh functions to ensure data consistency. Choose the approach based on the specific use case to prevent stale data issues
- **HOOKS USAGE**: Use custom hooks for client-side data fetching, caching, and reactive state derived from stores. Never use hooks to create or return stores
- **FOLDER STRUCTURE**: Organize code with feature-based structure: routes/ for pages/APIs, lib/components/app/ for business features, lib/components/shared/ for cross-feature components, lib/components/ui/ for base UI components, lib/server/ for server-only code, lib/stores/ for all stores, lib/utils.ts for utilities
- **ERROR HANDLING**: Centralize error handling to provide user-friendly messages and simplify debugging
- **TODO TRACKING**: Always create a todo list before starting a task to track progress and ensure all requirements are met
- **COMMIT MESSAGES**: When committing changes, always write detailed commit messages that explain the purpose and impact of the changes
- **STAGED FILES**: Before committing, check all staged files to understand the full context of what's being committed; only commit staged files, not all files
- **SHADCN COMPONENTS**: Never modify UI files directly as they are Shadcn components and should not be touched. Always use the original Shadcn component system for any UI changes
- **CONTEXT 7MCP**: Use context 7mcp for proper fixes; avoid using timeouts and hacky solutions in favor of proper, well-structured implementations
- Do not remove console.logs until specifically requested. Leave them alone.
