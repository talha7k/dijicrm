# Design: Remove Template Default Values and Implement Strict Data Validation

## Architecture Overview

This change fundamentally shifts the template system from a "generate with defaults" approach to a "validate first, then generate" approach. The design ensures data integrity by preventing document generation when required data is missing.

## Current State Problems

### 1. Auto-Generated Default Values

```typescript
// Current problematic approach
if (!enrichedData.items) {
  enrichedData.items = [
    { description: "Sample Service", quantity: 1, rate: 100.0 },
  ];
}
```

### 2. Silent Data Generation

- System generates documents with fake data
- Users may not notice missing real data
- Business risk from inaccurate documents

## New Architecture

### 1. Data Validation Pipeline

```
Template Selection → Data Requirement Analysis → Client Data Check →
Missing Data Alert → Data Collection → Validation → Document Generation
```

### 2. Data Sources Priority

1. **Client-Specific Variables**: Stored per client per template
2. **Template Defaults**: Only for system-generated values (dates, IDs)
3. **No Fallbacks**: Required fields must have actual data

### 3. Variable Management System

#### Client Variables Collection

```typescript
interface ClientVariable {
  id: string;
  clientId: string;
  templateId?: string; // Optional - specific to template
  variableKey: string;
  value: any;
  dataType: "text" | "number" | "date" | "currency" | "boolean" | "image";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Template Variable Categories

```typescript
interface TemplateVariable {
  key: string;
  label: string;
  type: "system" | "client" | "custom";
  dataType: "text" | "number" | "date" | "currency" | "boolean" | "image";
  required: boolean;
  category?: string;
  description?: string;
}
```

## Component Design

### 1. Enhanced Template Cards

- Expandable accordion showing required variables
- Visual indicators for data availability
- Categorized display (System, Client, Custom)
- Quick access to manage missing data
- Real-time variable detection during template creation

### 2. Template Creation Wizard

- Step-by-step template creation with variable validation
- Real-time variable extraction and categorization
- Variable source mapping interface
- Template testing with sample data
- Integration with Client Variable Manager

### 3. Client Variable Manager

- Tab in client detail page
- Template-specific variable sets
- Bulk variable management
- Variable templates for reuse
- Automatic variable detection from new templates

### 4. Variable Mapping Interface

- System variable auto-mapping
- Client data field selection
- Custom variable definition
- Data source validation
- Variable inheritance for template copies

### 5. Data Validation Interface

- Pre-generation validation screen
- Clear missing data indicators
- Direct links to provide missing data
- Generation blocking until complete
- Variable requirement summary

### 6. Template Styling System

- CSS editor with syntax highlighting and validation
- Print media query support and optimization
- Page break control and layout management
- Visual template editor with real-time preview
- PDF generation with advanced features

### 7. PDF Generation Pipeline

- Puppeteer-based PDF generation with print optimization
- Page size and orientation control
- Header/footer management and page numbering
- PDF metadata and security features
- Batch generation and processing capabilities

## API Design

### 1. Validation Endpoint

```typescript
GET /api/templates/:id/validate/:clientId
Response: {
  canGenerate: boolean;
  missingVariables: {
    key: string;
    label: string;
    type: string;
    required: boolean;
  }[];
  availableVariables: string[];
}
```

### 2. Client Variables Endpoints

```typescript
GET /api/clients/:id/variables
POST /api/clients/:id/variables
PUT /api/clients/:id/variables/:variableId
DELETE /api/clients/:id/variables/:variableId
```

### 3. Enhanced Generation Endpoint

```typescript
POST /api/documents/generate
Request: {
  templateId: string;
  clientId: string;
  data?: Record<string, any>; // Optional override
}
Response: {
  success: boolean;
  error?: {
    code: 'MISSING_DATA';
    missingVariables: string[];
    message: string;
  };
  result?: DocumentGenerationResult;
}
```

## Data Flow

### 1. Template Selection Flow

1. User selects template
2. System validates data requirements
3. Shows missing data if any
4. Blocks generation until data is complete

### 2. Client Data Management Flow

1. Navigate to client detail page
2. Access "Template Data" tab
3. View required variables for each template
4. Input and save client-specific values
5. Mark templates as "ready for generation"

### 3. Document Generation Flow

1. Select template and client
2. Pre-validation check
3. If validation passes → generate document
4. If validation fails → show missing data interface

## Implementation Strategy

### Phase 1: Remove Default Generation

- Remove `enrichTemplateData()` function
- Update validation to fail on missing required data
- Update preview generation to use only provided data

### Phase 2: Add Validation Layer

- Create validation endpoints
- Update generation API with pre-validation
- Add client variable collection

### Phase 3: Enhance UI

- Update template cards with variable display
- Add client variable management interface
- Create data collection workflows

### Phase 4: Polish and Optimize

- Add variable templates
- Implement bulk operations
- Add data import/export

## Benefits

1. **Data Integrity**: No fake data in documents
2. **User Control**: Complete visibility into data requirements
3. **Business Safety**: Prevents inaccurate document generation
4. **Better UX**: Clear guidance and workflows
5. **Scalability**: Handles any custom template needs

## Migration Considerations

1. **Existing Templates**: Continue working but require explicit data
2. **User Education**: Clear messaging about the change
3. **Data Migration**: Tools to help users populate missing data
4. **Backward Compatibility**: Graceful handling of existing workflows

This design ensures that the system enforces data completeness while providing users with the tools and guidance needed to manage their template data effectively.
