### Requirement: Document Template Creation

Company users SHALL be able to create and manage HTML-based document templates with placeholder values for dynamic content insertion via a dedicated creation page, stored in Firebase.

#### Scenario: Create invoice template

- **WHEN** company user navigates to template creation page
- **THEN** they can define HTML structure with placeholders like {{clientName}}, {{amount}}, {{dueDate}}
- **AND** template is saved and validated for proper HTML structure

#### Scenario: Create template in Firebase

- **WHEN** company user saves a template
- **THEN** template document is created in Firebase templates collection
- **AND** associated with companyId
- **AND** version history is maintained

#### Scenario: Template preview

- **WHEN** company user previews a template on creation page
- **THEN** sample data is inserted into placeholders
- **AND** rendered HTML is displayed for review

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

### Requirement: Template Management

Company users SHALL be able to organize, edit, and version their document templates stored in Firebase.

#### Scenario: Edit existing template

- **WHEN** company user modifies a template
- **THEN** changes are saved as new version
- **AND** previous versions remain accessible

#### Scenario: Template categorization

- **WHEN** company user organizes templates
- **THEN** they can categorize by type (invoice, legal, business)
- **AND** filter and search templates by category

#### Scenario: Load templates from Firebase

- **WHEN** company user accesses template management
- **THEN** templates are loaded from Firebase templates collection
- **AND** filtered by companyId
- **AND** real-time updates via listeners

### Requirement: Placeholder System

Templates SHALL support a comprehensive placeholder system for dynamic content insertion.

#### Scenario: Standard placeholders

- **WHEN** template uses standard placeholders
- **THEN** system recognizes {{clientName}}, {{companyName}}, {{date}}, {{amount}}
- **AND** replaces with appropriate data during generation

#### Scenario: Custom placeholders

- **WHEN** template includes custom placeholders
- **THEN** system allows definition of custom field mappings
- **AND** validates that all placeholders have corresponding data
