## MODIFIED Requirements

### Requirement: Company Settings Access

Company users SHALL have direct access to company-wide settings and configurations including SMTP email settings and company branding options.

#### Scenario: Access company settings

- **WHEN** company user clicks settings
- **THEN** they are navigated to the company settings page
- **AND** can modify billing preferences, notification templates, and system configurations
- **AND** can configure SMTP email server settings
- **AND** can upload company logo and configure document branding

#### Scenario: SMTP Configuration Management

- **WHEN** a company user accesses the settings page
- **THEN** SMTP configuration fields are displayed
- **AND** current saved settings are loaded and displayed
- **AND** users can modify and save SMTP settings

#### Scenario: Company Branding Configuration

- **WHEN** a company user accesses the settings page
- **THEN** company branding fields are displayed
- **AND** users can upload a company logo
- **AND** users can configure stamp settings for documents

#### Scenario: Settings Persistence

- **WHEN** a company user saves settings changes
- **THEN** all configuration data is persisted to Firebase
- **AND** success confirmation is displayed
- **AND** settings are immediately applied where applicable

## ADDED Requirements

### Requirement: Logo Upload and Management

The settings page SHALL allow companies to upload and manage their logo for use in generated documents.

#### Scenario: Logo Upload

- **WHEN** a company user selects a logo file
- **THEN** the file is validated for size and format
- **AND** uploaded to Firebase Storage
- **AND** the logo URL is saved to company settings

#### Scenario: Logo Display and Replacement

- **WHEN** a company has an uploaded logo
- **THEN** the logo is displayed in the settings page
- **AND** users can replace the existing logo
- **AND** old logos are cleaned up from storage

### Requirement: Stamp Configuration

The settings page SHALL allow companies to configure stamp settings for document branding.

#### Scenario: Stamp Settings Configuration

- **WHEN** a company user accesses stamp settings
- **THEN** fields for stamp text and positioning are available
- **AND** users can save stamp configuration
- **AND** settings are validated before saving

#### Scenario: Stamp Preview

- **WHEN** a company user configures stamp settings
- **THEN** a preview of the stamp appearance is shown
- **AND** users can adjust settings based on the preview</content>
  </xai:function_call">

<xai:function_call name="write">
<parameter name="filePath">openspec/changes/add-smtp-persistence-and-branding/specs/document-generation/spec.md
