## ADDED Requirements

### Requirement: SMTP Configuration Persistence

The system SHALL persist SMTP configuration settings in Firebase Firestore for each company, allowing settings to survive app restarts and be shared across sessions.

#### Scenario: Save SMTP Configuration

- **WHEN** a company user saves SMTP settings in the settings page
- **THEN** the configuration is stored in Firebase Firestore
- **AND** sensitive fields (passwords) are encrypted before storage

#### Scenario: Load SMTP Configuration

- **WHEN** the application starts
- **THEN** SMTP configuration is loaded from Firebase for the current company
- **AND** the email service is initialized with the persisted settings

#### Scenario: Update SMTP Configuration

- **WHEN** a company user modifies existing SMTP settings
- **THEN** the updated configuration replaces the previous settings in Firebase
- **AND** the email service is reinitialized with new settings

### Requirement: Email Service Initialization

The email service SHALL automatically load and apply SMTP configuration from Firebase on application startup, ensuring consistent email delivery behavior.

#### Scenario: App Startup with SMTP Config

- **WHEN** the application initializes for a company with saved SMTP settings
- **THEN** the email service loads the configuration from Firebase
- **AND** applies the settings to enable SMTP email sending

#### Scenario: App Startup without SMTP Config

- **WHEN** the application initializes for a company without saved SMTP settings
- **THEN** the email service operates in mock mode
- **AND** no errors are thrown during initialization

### Requirement: SMTP Configuration Security

SMTP configuration SHALL be stored securely with appropriate access controls and encryption for sensitive data.

#### Scenario: Secure Storage

- **WHEN** SMTP configuration is saved
- **THEN** passwords are encrypted using Firebase security best practices
- **AND** configuration is only accessible to authorized company users

#### Scenario: Configuration Access Control

- **WHEN** a user attempts to access SMTP configuration
- **THEN** access is granted only if they belong to the same company
- **AND** unauthorized access attempts are logged and denied</content>
  </xai:function_call">

<xai:function_call name="write">
<parameter name="filePath">openspec/changes/add-smtp-persistence-and-branding/specs/company-dashboard/spec.md
