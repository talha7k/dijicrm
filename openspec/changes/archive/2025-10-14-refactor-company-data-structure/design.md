## Context

The current CRM system has a multi-tenant architecture with companies, members, and clients, but the data access patterns are inconsistent. While Firebase security rules provide some protection, the client-side code and data models don't consistently enforce company-scoped data access, creating potential for data leakage between companies.

## Goals / Non-Goals

- Goals: Ensure all data access is properly scoped by company, prevent cross-company data leakage, provide clear company context management
- Non-Goals: Complete rewrite of existing features, changing the fundamental user roles (company/member/client)

## Decisions

- Decision: Make `companyId` a required field for all data operations and enforce it at the store layer
- Alternatives considered: Relying solely on Firebase security rules (insufficient for client-side UX), using separate databases per company (too complex for current scale)

- Decision: Create a centralized company context store that all other stores depend on
- Alternatives considered: Passing companyId as parameter to every function (verbose and error-prone), using URL-based company context (doesn't work for all scenarios)

- Decision: Implement company switching for users with multiple associations
- Alternatives considered: Forcing users to log out/in to switch companies (poor UX), showing all company data mixed together (confusing and insecure)

## Risks / Trade-offs

- Performance: Additional company filtering queries may impact performance → Mitigation: Use proper Firestore indexes and compound queries
- Complexity: More complex state management → Mitigation: Clear documentation and consistent patterns
- Migration: Existing data may need updates → Mitigation: Gradual migration with backward compatibility

## Migration Plan

1. Add company context store without breaking existing functionality
2. Update stores one by one to use company context
3. Update Firebase security rules to match new patterns
4. Add migration script for existing data
5. Update UI components to show company context
6. Remove old data access patterns

Rollback: Keep old access patterns during transition, feature flag new behavior

## Open Questions

- How to handle users with no company associations?
- Should we allow company admins to see all client data or only their assigned clients?
- How to handle data migration for existing production data?
