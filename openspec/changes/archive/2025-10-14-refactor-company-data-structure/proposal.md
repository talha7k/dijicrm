## Why

The current data structure has inconsistent company-based access control where some data might be accessible by users outside their intended company scope. While Firebase security rules provide some protection, the data models and client-side access patterns need to be refactored to ensure proper multi-tenant data isolation.

## What Changes

- **BREAKING**: Refactor all data models to consistently use `companyId` as the primary partition key
- **BREAKING**: Update all stores to enforce company-scoped queries by default
- **BREAKING**: Add company context management to ensure all data access is company-aware
- Add data validation to prevent cross-company data leakage
- Update client access patterns to ensure clients only see their own data within their company
- Add company switching functionality for users with multiple company associations

## Impact

- Affected specs: authentication, company-dashboard, client-dashboard, invoice-payment-management
- Affected code: All data stores, Firebase security rules, user authentication flow
- Migration required: Existing data needs to be updated to ensure proper `companyId` associations
