### Requirement: Product/Service CRUD Operations

Company users SHALL be able to create, read, update, and delete products and services.

#### Scenario: Create new product

- **WHEN** company user creates a new product
- **THEN** they can specify name, description, category, and pricing
- **AND** product is saved with active status

#### Scenario: Update existing product

- **WHEN** company user modifies a product
- **THEN** changes are saved and version history is maintained
- **AND** dependent documents are notified of changes

#### Scenario: Deactivate product

- **WHEN** company user deactivates a product
- **THEN** it becomes unavailable for new cases
- **AND** existing cases continue to reference it

### Requirement: Product Categorization

Products SHALL be categorized into service, product, or subscription types.

#### Scenario: Service category

- **WHEN** creating a service-type product
- **THEN** system allows one-time professional services
- **AND** tracks completion status

#### Scenario: Product category

- **WHEN** creating a product-type item
- **THEN** system supports tangible or digital goods
- **AND** manages inventory if applicable

#### Scenario: Subscription category

- **WHEN** creating a subscription
- **THEN** system handles recurring billing
- **AND** tracks subscription lifecycle

### Requirement: Pricing Management

Products SHALL support fixed pricing or contact-based pricing.

#### Scenario: Fixed pricing

- **WHEN** product has fixed price
- **THEN** price is displayed in invoices
- **AND** calculations are automatic

#### Scenario: Contact pricing

- **WHEN** product requires custom pricing
- **THEN** system allows manual price entry during invoice creation
- **AND** tracks negotiated prices

### Requirement: Product Status Management

Products SHALL have active/inactive status for availability control.

#### Scenario: Active products

- **WHEN** product is active
- **THEN** it appears in selection lists
- **AND** can be added to new cases

#### Scenario: Inactive products

- **WHEN** product is inactive
- **THEN** it remains visible in history
- **AND** cannot be selected for new cases
