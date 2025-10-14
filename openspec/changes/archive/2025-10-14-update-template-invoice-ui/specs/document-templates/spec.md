## MODIFIED Requirements

### Requirement: Document Template Creation

Company users SHALL be able to create and manage HTML-based document templates with placeholder values for dynamic content insertion via a dedicated creation page.

#### Scenario: Create invoice template

- **WHEN** company user navigates to template creation page
- **THEN** they can define HTML structure with placeholders like {{clientName}}, {{amount}}, {{dueDate}}
- **AND** template is saved and validated for proper HTML structure

#### Scenario: Template preview

- **WHEN** company user previews a template on creation page
- **THEN** sample data is inserted into placeholders
- **AND** rendered HTML is displayed for review

## ADDED Requirements

### Requirement: Sample Templates

Company users SHALL be able to view and use sample templates when creating new templates.

#### Scenario: Browse sample templates

- **WHEN** company user visits template creation page
- **THEN** sample templates are displayed for selection
- **AND** they can choose a sample as starting point

#### Scenario: Use sample template

- **WHEN** company user selects a sample template
- **THEN** the sample content is loaded into the editor
- **AND** they can modify it before saving
