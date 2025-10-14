## Context

Users need a simple, client-focused workflow to manage products, orders, and document delivery. The current system has powerful individual components but lacks an integrated client-centric interface.

## Goals / Non-Goals

**Goals:**

- Simple client management with product/order history
- Easy document sending with custom PDFs and templates
- Basic payment tracking per client
- Intuitive email composition

**Non-Goals:**

- Complex analytics and reporting
- Advanced workflow automation
- Multi-channel delivery systems
- Complex document versioning

## Decisions

- **Client-Centric Design**: Focus on client detail page as main hub
- **Simple Document Upload**: Basic PDF upload without complex processing
- **Straightforward Email**: Editable subject and body without templates
- **Basic Status Tracking**: Simple payment/delivery status without detailed analytics

## Implementation Approach

1. **Client Detail Page**: Central hub showing client info, products, orders, payments
2. **Document Send Modal**: Simple interface for selecting documents and composing email
3. **Order Management**: Basic order creation and status tracking
4. **Payment Recording**: Simple payment form with status updates

## Technical Considerations

- Extend existing client management store
- Use existing document delivery system with simplified interface
- Leverage Firebase Storage for PDF uploads
- Keep invoice payment tracking simple and integrated
