## MODIFIED Requirements

### Requirement: Document Template Creation

Company users SHALL be able to create and manage HTML-based document templates with placeholder values for dynamic content insertion via a dedicated creation page, stored in Firebase.

#### Scenario: Create invoice template

- **WHEN** company user navigates to template creation page
- **THEN** they can define HTML structure with placeholders like {{clientName}}, {{amount}}, {{dueDate}}
- **AND** template is saved to Firebase and validated for proper HTML structure

#### Scenario: Template preview

- **WHEN** company user previews a template on creation page
- **THEN** sample data is inserted into placeholders
- **AND** rendered HTML is displayed for review

### Requirement: Template Management

Company users SHALL be able to organize, edit, and version their document templates stored in Firebase.

#### Scenario: Edit existing template

- **WHEN** company user modifies a template
- **THEN** changes are saved to Firebase as new version
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
