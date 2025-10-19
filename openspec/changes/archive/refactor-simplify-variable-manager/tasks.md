## 1. Remove Complex Variable Management Services

- [x] 1.1 Remove `src/lib/services/variableCatalogService.ts`
- [x] 1.2 Remove `src/lib/services/variableCollectionService.ts`
- [x] 1.3 Remove `src/lib/services/variableDetectionService.ts`
- [x] 1.4 Remove `src/lib/stores/customTemplateVariables.ts`

## 2. Simplify Type Definitions

- [x] 2.1 Simplify `src/lib/types/templateVariable.ts` to only essential types
- [x] 2.2 Remove complex interfaces like `VariableTemplate`, `ClientTemplateVariable`
- [x] 2.3 Keep only basic system variable definitions

## 3. Simplify Template Rendering

- [x] 3.1 Keep Handlebars in `src/lib/utils/template-rendering.ts` but remove variable management complexity
- [x] 3.2 Remove fallback mechanisms and complex variable catalog dependencies
- [x] 3.3 Keep only essential system variables (currentDate, companyName, etc.) and Handlebars helpers
- [x] 3.4 Simplify preview data generation to work with data objects

## 4. Update Variable Manager Component

- [x] 4.1 Simplify `src/lib/components/app/template/custom-variable-manager.svelte`
- [x] 4.2 Remove complex tabs and management features
- [x] 4.3 Replace with simple data input interface
- [x] 4.4 Remove import/export, detection, and template features

## 5. Update Template Generation Flow

- [x] 5.1 Update document generation to use simple data objects
- [x] 5.2 Remove variable template dependencies
- [x] 5.3 Ensure system data is loaded automatically from collections
- [x] 5.4 Test template rendering with simplified approach

## 6. Clean Up Dependencies

- [x] 6.1 Remove unused imports across affected files
- [x] 6.2 Update any components that reference removed services
- [x] 6.3 Remove Firebase collections related to complex variable management
- [x] 6.4 Run type checking to ensure no broken references
