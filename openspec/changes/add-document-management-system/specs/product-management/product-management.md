# Product/Service Management

## Overview

The product/service management system allows companies to define and manage the products and services they offer to clients. This forms the foundation for document requirements and invoice creation.

## Features

### Product/Service CRUD

- Create, read, update, and delete products/services
- Categorization (service, product, subscription)
- Pricing information (fixed price or contact pricing)
- Active/inactive status management
- Rich descriptions and metadata

### Integration Points

- **Document Requirements**: Products/services can have associated document requirements
- **Invoice Creation**: Products/services can be added as line items to invoices
- **Business Cases**: Products/services form the basis of client engagements

## Data Model

```typescript
interface Product {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category: "service" | "product" | "subscription";
  price?: number; // Optional for contact pricing
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## UI Components

### Products Management Page (`/products`)

- Grid layout showing all products/services
- Search and filter by category
- Create/edit/delete actions
- Status indicators (active/inactive)

### Product Form Component

- Name, description, category selection
- Price input (optional)
- Active status toggle
- Validation and error handling

### Invoice Integration

- Product/service selection in invoice creation
- Quantity management
- Automatic total calculation
- Line item management

## Business Logic

### Product Categories

- **Service**: One-time professional services (e.g., consulting, development)
- **Product**: Tangible or digital products
- **Subscription**: Recurring services (e.g., monthly maintenance)

### Pricing Strategy

- Fixed pricing for standard offerings
- Contact pricing for custom or enterprise solutions
- Support for quantity-based discounts (future enhancement)

## Future Enhancements

- Product bundles/packages
- Pricing tiers and discounts
- Product images and media
- Inventory management for physical products
- Product analytics and reporting
