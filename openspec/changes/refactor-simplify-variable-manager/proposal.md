## Why

The current variable management system is overly complex with multiple layers of abstraction, complex Firebase real-time listeners, and over-engineered features that make the code difficult to maintain and understand. This complexity creates unnecessary cognitive overhead and potential bugs.

## What Changes

- **Remove complex variable management stores** - Eliminate `customTemplateVariablesStore`, `variableCatalogService`, `variableCollectionService`, and `variableDetectionService`
- **Simplify to data-driven approach** - Replace complex variable tracking with simple data objects that are passed directly to templates
- **Remove variable templates and collections** - Eliminate the concept of variable templates and collections, using simple key-value data instead
- **Keep Handlebars for template features** - Maintain Handlebars for conditional logic (`{{#if}}`), loops (`{{#each}}`), and helpers (`{{formatCurrency}}`, `{{multiply}}`)
- **Keep only essential system variables** - Reduce the system variable catalog to only truly auto-generated values
- **Remove usage tracking and statistics** - Eliminate complex tracking features that add little value

## Impact

- **Affected specs**: document-generation, document-templates
- **Affected code**:
  - `src/lib/stores/customTemplateVariables.ts` (remove)
  - `src/lib/services/variableCatalogService.ts` (remove)
  - `src/lib/services/variableCollectionService.ts` (remove)
  - `src/lib/services/variableDetectionService.ts` (remove)
  - `src/lib/components/app/template/custom-variable-manager.svelte` (simplify)
  - `src/lib/utils/template-rendering.ts` (simplify)
  - `src/lib/types/templateVariable.ts` (simplify)
