## 1. Data Model Refactoring

- [x] 1.1 Update UserProfile interface to enforce company context
- [x] 1.2 Add CompanyContext type for managing active company state
- [x] 1.3 Review and update all data models to ensure companyId is required
- [x] 1.4 Add data validation utilities for company-scoped operations

## 2. Store Layer Updates

- [x] 2.1 Create company context store for managing active company
- [x] 2.2 Update user store to handle company switching
- [x] 2.3 Refactor orders store to enforce company-scoped queries
- [x] 2.4 Refactor payments store to enforce company-scoped queries
- [x] 2.5 Refactor all other stores to use company context
- [x] 2.6 Add company validation middleware to all store operations

## 3. Client Access Control

- [x] 3.1 Update client data access to filter by both companyId and clientId
- [x] 3.2 Ensure clients can only access their own invoices/payments
- [x] 3.3 Add company context validation for client dashboard
- [x] 3.4 Update client invitation system to properly associate companies

## 4. Security Rules Enhancement

- [x] 4.1 Review and update Firebase security rules for consistency
- [x] 4.2 Add additional validation for cross-company access prevention
- [x] 4.3 Test security rules with different user roles

## 5. Migration and Testing

- [x] 5.1 Create data migration script for existing data
- [x] 5.2 Write tests for company-scoped data access
- [x] 5.3 Test multi-company user scenarios
- [x] 5.4 Test client access control scenarios
- [x] 5.5 Performance testing for company-scoped queries

## 6. UI Updates

- [x] 6.1 Add company switcher for users with multiple companies
- [x] 6.2 Update dashboard layouts to show company context
- [x] 6.3 Add error handling for company access violations
- [x] 6.4 Update onboarding to properly set company associations
