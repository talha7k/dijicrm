## Context

The current variable management system has grown overly complex with multiple layers of abstraction, Firebase real-time listeners, and features that provide little value while creating maintenance overhead. The system includes:

- Complex stores with real-time Firebase listeners
- Variable catalogs, templates, and collections
- Usage tracking and statistics
- Variable detection and analysis
- Import/export functionality

This complexity makes the code difficult to understand, maintain, and debug.

## Goals / Non-Goals

- Goals: Simplify template rendering to use basic data objects, remove unnecessary abstraction layers, reduce code complexity
- Non-Goals: Maintain backward compatibility with complex variable features, keep usage tracking, preserve variable templates

## Decisions

- Decision: Replace complex variable management with simple data object approach
  - Alternatives considered: Keep current system, incremental refactoring
  - Rationale: Complete simplification provides cleaner architecture and removes technical debt

- Decision: Keep Handlebars for template features but remove variable management complexity
  - Alternatives considered: Use simple string replacement, use other templating engines
  - Rationale: Handlebars is needed for conditional logic, loops, and helpers used in existing templates

- Decision: Auto-load system data from collections
  - Alternatives considered: Manual data loading, complex data mapping
  - Rationale: Automatic loading provides better user experience and reduces manual work

## Risks / Trade-offs

- Risk: Breaking existing templates that rely on complex variable features
  - Mitigation: Provide migration guide and ensure basic {{key}} replacement still works

- Risk: Losing some advanced templating capabilities
  - Mitigation: Focus on core use cases and add features only when needed

- Trade-off: Reduced flexibility for simplicity
  - Acceptance: The current complexity outweighs the benefits of advanced features

## Migration Plan

1. **Phase 1**: Create new simplified template rendering function
2. **Phase 2**: Update document generation to use new approach
3. **Phase 3**: Remove old variable management services
4. **Phase 4**: Update UI components to use simplified approach
5. **Phase 5**: Clean up unused Firebase collections and types

## Open Questions

- Should we keep all existing Handlebars helpers (formatCurrency, multiply, formatDate)?
- What's the best way to handle missing data in Handlebars templates?
- How to ensure data object structure matches template expectations?
