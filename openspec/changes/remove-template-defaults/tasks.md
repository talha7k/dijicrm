# Tasks: Remove Template Default Values and Implement Strict Data Validation

## Phase 1: Remove Default Value Generation

### Task 1.1: Remove enrichTemplateData Function

- **File**: `src/lib/utils/template-rendering.ts`
- **Action**: Remove the `enrichTemplateData()` function completely
- **Action**: Update `validateTemplateData()` to only validate provided data
- **Validation**: All existing tests should fail (expected) - update tests accordingly

### Task 1.2: Update Template Validation Logic

- **File**: `src/lib/utils/template-rendering.ts`
- **Action**: Modify `validateTemplateData()` to fail on missing required data
- **Action**: Remove auto-generation logic for all template types
- **Action**: Ensure only system variables (dates, IDs) can be auto-generated
- **Validation**: Write tests to confirm validation fails with missing data

### Task 1.3: Update Preview Data Generation

- **File**: `src/lib/utils/template-validation.ts`
- **Action**: Remove auto-generation of business data from `generatePreviewData()`
- **Action**: Keep only basic system variables for preview
- **Action**: Update preview to show "Data Required" indicators
- **Validation**: Preview generation should work but show missing data warnings

## Phase 2: Implement Client Variable Management

### Task 2.1: Create Client Variable Types

- **File**: `src/lib/types/clientVariable.ts`
- **Action**: Define `ClientVariable` interface
- **Action**: Define `VariableTemplate` interface
- **Action**: Define `TemplateVariable` interface with categories
- **Action**: Define variable classification types (System vs Custom)
- **Validation**: TypeScript compilation passes

### Task 2.2: Create Client Variable Store

- **File**: `src/lib/stores/clientVariables.ts`
- **Action**: Implement CRUD operations for client variables
- **Action**: Add query methods for template-specific variables
- **Action**: Implement variable template management
- **Action**: Add automatic variable detection from templates
- **Validation**: Write unit tests for store operations

### Task 2.3: Create Client Variable API Endpoints

- **File**: `src/routes/api/clients/[id]/variables/+server.ts`
- **Action**: Implement GET endpoint for client variables
- **Action**: Implement POST endpoint for creating variables
- **Action**: Implement PUT endpoint for updating variables
- **Action**: Implement DELETE endpoint for removing variables
- **Validation**: Test API endpoints with various scenarios

### Task 2.4: Create Variable Template API

- **File**: `src/routes/api/variable-templates/+server.ts`
- **Action**: Implement CRUD operations for variable templates
- **Action**: Add template application endpoint
- **Action**: Implement template search and filtering
- **Validation**: Test template creation and application

### Task 2.5: Build Variable Detection System

- **File**: `src/lib/utils/variableDetection.ts`
- **Action**: Create variable extraction from template content
- **Action**: Implement variable type inference
- **Action**: Add automatic Client Variable Manager updates
- **Action**: Build variable classification logic
- **Validation**: New template variables are detected automatically

### Task 2.6: Create Variable Catalog System

- **File**: `src/lib/data/variableCatalog.ts`
- **Action**: Define system variable catalog
- **Action**: Create variable browser interface
- **Action**: Implement variable suggestions and autocomplete
- **Action**: Add variable usage tracking
- **Validation**: Variable catalog provides accurate suggestions

## Phase 3: Template Creation Workflow

### Task 3.1: Create Simple Template Creation Form

- **File**: `src/lib/components/app/template/simple-template-form.svelte`
- **Action**: Build basic template creation form
- **Action**: Add template name and description fields
- **Action**: Implement template category selection
- **Action**: Create simple save functionality
- **Validation**: Form creates templates with basic information

### Task 3.2: Build Variable Reference List

- **File**: `src/lib/components/app/template/variable-reference.svelte`
- **Action**: Create simple list of system variables
- **Action**: Add variable descriptions and copy-paste
- **Action**: Show which variables are auto-populated
- **Action**: Provide basic variable usage examples
- **Validation**: Variable reference helps users understand available variables

### Task 3.3: Create Template Content Text Area

- **File**: `src/lib/components/app/template/template-content-textarea.svelte`
- **Action**: Build simple text area for HTML content
- **Action**: Add basic template preview
- **Action**: Implement simple content saving
- **Action**: Add variable reference alongside content area
- **Validation**: Text area allows simple template content entry

### Task 3.4: Implement Basic Template Validation

- **File**: `src/lib/utils/basicTemplateValidation.ts`
- **Action**: Create basic template validation
- **Action**: Add required field validation
- **Action**: Implement simple HTML syntax checking
- **Action**: Build basic error reporting
- **Validation**: Basic validation prevents major errors

### Task 3.5: Build Simple Variable List Component

- **File**: `src/lib/components/app/template/simple-variable-list.svelte`
- **Action**: Create simple variable reference list
- **Action**: Implement basic variable browsing
- **Action**: Add copy-paste functionality for variables
- **Action**: Build variable description display
- **Validation**: Variable list provides basic variable information

### Task 3.7: Build Simple CSS Text Areas

- **File**: `src/lib/components/app/template/css-textareas.svelte`
- **Action**: Create simple text areas for CSS input
- **Action**: Implement separate screen and print CSS areas
- **Action**: Add copy-paste functionality for CSS
- **Action**: Build CSS template library with copy-paste snippets
- **Validation**: CSS text areas provide simple styling input

### Task 3.8: Create Basic Template Editor

- **File**: `src/lib/components/app/template/basic-editor.svelte`
- **Action**: Build simple HTML content text area
- **Action**: Implement basic preview functionality
- **Action**: Add simple print preview
- **Action**: Create basic zoom controls
- **Validation**: Basic editor provides simple template creation

### Task 3.9: Implement Page Break Management

- **File**: `src/lib/utils/pageBreakManager.ts`
- **Action**: Create page break detection and optimization
- **Action**: Implement automatic page break insertion
- **Action**: Add manual page break controls
- **Action**: Build page boundary visualization
- **Validation**: Page breaks work correctly for professional output

## Phase 4: Enhanced Template UI

### Task 4.1: Create Template Variable Accordion

- **File**: `src/lib/components/shared/template-variable-accordion.svelte`
- **Action**: Create expandable component for variable display
- **Action**: Implement variable categorization (System, Client, Custom)
- **Action**: Add data availability indicators
- **Validation**: Component renders correctly with sample data

### Task 4.2: Update Template Cards

- **File**: `src/routes/(app)/templates/+page.svelte`
- **Action**: Replace simple placeholder count with variable accordion
- **Action**: Add data availability status indicators
- **Action**: Implement filtering by data completeness
- **Validation**: Template cards show variable information correctly

### Task 4.3: Create Client Variable Manager

- **File**: `src/lib/components/app/client/client-variable-manager.svelte`
- **Action**: Create interface for managing client variables
- **Action**: Implement variable input controls for all data types
- **Action**: Add variable template application
- **Validation**: Can create, update, and delete client variables

### Task 4.4: Add Template Data Tab to Client Page

- **File**: `src/routes/(app)/clients/[id]/+page.svelte`
- **Action**: Add "Template Data" tab to client interface
- **Action**: Integrate client variable manager
- **Action**: Show template readiness status
- **Validation**: Can manage template data from client page

### Task 4.5: Build Template-First Data Entry Interface

- **File**: `src/lib/components/app/client/template-data-entry.svelte`
- **Action**: Create template selection interface for data entry
- **Action**: Build guided data collection workflow
- **Action**: Implement progress tracking and recovery
- **Action**: Add template-specific variable organization
- **Validation**: Template-first approach provides efficient data entry

### Task 4.6: Create Advanced Variable Management UI

- **File**: `src/lib/components/app/template/advanced-variable-manager.svelte`
- **Action**: Build bulk data management interface
- **Action**: Implement advanced filtering and search
- **Action**: Add variable templates and snippets
- **Action**: Create comprehensive variable management tools
- **Validation**: Power users have efficient variable management tools

### Task 4.7: Enhance PDF Generation Pipeline

- **File**: `src/lib/utils/pdfGenerator.ts`
- **Action**: Enhance Puppeteer PDF generation with print optimization
- **Action**: Implement page size and orientation controls
- **Action**: Add header/footer management system
- **Action**: Create PDF metadata and security features
- **Validation**: PDF generation produces professional quality output

### Task 4.8: Build Basic Print Preview

- **File**: `src/lib/components/app/template/basic-print-preview.svelte`
- **Action**: Create basic print preview interface
- **Action**: Implement simple document display
- **Action**: Add basic page boundaries
- **Action**: Build simple print preview
- **Validation**: Print preview shows template output

## Phase 5: Template Styling and PDF Generation

### Task 5.1: Create Simple Template Styling System

- **File**: `src/lib/stores/templateStyling.ts`
- **Action**: Implement basic CSS storage and retrieval
- **Action**: Create simple CSS template library
- **Action**: Build explicit CSS application (no inheritance)
- **Action**: Add basic CSS validation
- **Validation**: Template styling system manages CSS explicitly

### Task 5.2: Build Enhanced PDF Generation

- **File**: `src/lib/utils/enhancedPdfGenerator.ts`
- **Action**: Enhance PDF generation with explicit CSS support
- **Action**: Implement page break controls
- **Action**: Add basic PDF configuration options
- **Action**: Create print optimization features
- **Validation**: Enhanced PDF generation works with explicit CSS

### Task 5.3: Create Simple Style Management

- **File**: `src/lib/components/app/template/simple-style-manager.svelte`
- **Action**: Build simple CSS template library interface
- **Action**: Implement copy-paste CSS functionality
- **Action**: Add basic CSS validation
- **Action**: Create CSS template sharing
- **Validation**: Simple style management provides efficient CSS organization

### Task 5.4: Implement Basic Template Design

- **File**: `src/lib/utils/basicTemplate.ts`
- **Action**: Create basic template preview system
- **ACTION**: Implement simple layout support
- **Action**: Add basic print preview
- **Action**: Build simple template testing
- **Validation**: Basic template design works for print output

## Phase 6: Enhanced Document Generation

### Task 6.1: Create Template Validation Endpoint

- **File**: `src/routes/api/templates/[id]/validate/[clientId]/+server.ts`
- **Action**: Implement pre-generation validation
- **Action**: Return detailed missing data information
- **Action**: Include variable availability status
- **Validation**: Endpoint correctly identifies missing data

### Task 6.2: Update Document Generation API

- **File**: `src/routes/api/documents/generate/+server.ts`
- **Action**: Add pre-validation step before generation
- **Action**: Return structured error for missing data
- **Action**: Integrate client variable retrieval
- **Action**: Enhance PDF generation with styling support
- **Validation**: API fails appropriately with missing data and produces styled PDFs

### Task 6.3: Create Data Validation Alert Component

- **File**: `src/lib/components/shared/data-validation-alert.svelte`
- **Action**: Create component for showing missing data
- **Action**: Add direct links to manage missing variables
- **Action**: Implement clear error messaging
- **Validation**: Alert shows correct missing data information

### Task 6.4: Update Document Generation Flow

- **File**: Various document generation components
- **Action**: Add validation check before generation
- **Action**: Show data validation alert when needed
- **Action**: Block generation until data is complete
- **Action**: Integrate template styling in generation flow
- **Validation**: Cannot generate documents with missing data and styling works correctly

## Phase 7: Testing and Polish

### Task 7.1: Update Existing Tests

- **File**: `src/lib/utils/template-rendering.test.ts`
- **Action**: Update tests to expect validation failures
- **Action**: Add tests for strict validation behavior
- **Action**: Remove tests for auto-generation
- **Action**: Add tests for template styling and PDF generation
- **Validation**: All tests pass with new validation logic

### Task 7.2: Add Integration Tests

- **File**: New test files for client variables
- **Action**: Test client variable CRUD operations
- **Action**: Test template validation with client data
- **Action**: Test document generation with complete data
- **Action**: Test template creation workflow
- **Action**: Test template styling and PDF output
- **Validation**: Integration tests cover all scenarios

### Task 7.3: Add E2E Tests

- **File**: New E2E test files
- **Action**: Test complete workflow from template to generation
- **Action**: Test client variable management
- **Action**: Test template creation and variable detection
- **Action**: Test error handling for missing data
- **Action**: Test template styling and PDF generation
- **Validation**: E2E tests cover user workflows

### Task 7.4: Performance Optimization

- **File**: Various stores and API endpoints
- **Action**: Optimize client variable queries
- **Action**: Add caching for template validation
- **Action**: Implement efficient bulk operations
- **Action**: Optimize PDF generation performance
- **Validation**: Performance meets acceptable standards

## Phase 8: Documentation and Migration

### Task 8.1: Update User Documentation

- **File**: Documentation files
- **Action**: Document new template data requirements
- **Action**: Create guide for client variable management
- **Action**: Add template creation workflow guide
- **Action**: Add template styling and CSS documentation
- **Action**: Add troubleshooting for validation errors
- **Validation**: Documentation is clear and comprehensive

### Task 8.2: Create Migration Guide

- **File**: Migration documentation
- **Action**: Document changes from old system
- **Action**: Provide steps for existing users
- **Action**: Create data migration tools if needed
- **Action**: Document template styling migration
- **Validation**: Migration guide covers all scenarios

### Task 8.3: Add In-App Guidance

- **File**: UI components
- **Action**: Add tooltips and help text
- **Action**: Create onboarding flow for new system
- **Action**: Add contextual help for variable management
- **Action**: Add template creation guidance
- **Action**: Add template styling tutorials
- **Validation**: Users understand new system without confusion

## Dependencies and Parallel Work

### Parallelizable Tasks:

- Tasks 2.1, 2.2, 2.3 can be done in parallel
- Tasks 3.1, 3.2, 3.3 can be done in parallel
- Tasks 5.1, 5.2, 5.3 can be done in parallel

### Dependencies:

- Phase 2 depends on Phase 1 completion
- Phase 3 depends on Phase 2 completion
- Phase 4 depends on Phase 2 and 3 completion
- Phase 5 depends on Phase 3 completion (template styling needs template creation)
- Phase 6 depends on Phases 2-5 completion
- Phase 7 depends on Phases 1-6 completion
- Phase 8 depends on all previous phases

### Critical Path:

1. Remove default generation (Phase 1)
2. Implement client variables (Phase 2)
3. Build template creation workflow (Phase 3)
4. Update UI components (Phase 4)
5. Implement template styling and PDF generation (Phase 5)
6. Enhance generation flow (Phase 6)
7. Testing and validation (Phase 7)
8. Documentation and migration (Phase 8)
