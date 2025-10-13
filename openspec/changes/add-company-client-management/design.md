## Context

The current system requires clients to self-register before companies can interact with them. This creates friction in business processes where companies need to prepare invoices, documents, and communications proactively. The enhancement introduces company-initiated client account creation with an invitation flow.

## Goals / Non-Goals

### Goals

- Enable companies to create client accounts proactively
- Provide seamless invitation and activation flow
- Maintain security and data integrity
- Support existing invoice and document workflows for pre-registered clients

### Non-Goals

- Change existing client self-registration flow
- Add complex client onboarding workflows
- Modify core authentication architecture
- Support bulk client operations beyond basic CRUD

## Decisions

### Client Status Model

**Decision**: Three-state client lifecycle (invited → active → inactive)

- **Rationale**: Clear progression from company creation to client activation
- **Trade-off**: Additional state management vs simpler binary active/inactive
- **Alternative Considered**: Immediate activation without invitation

### Invitation Token System

**Decision**: Secure token-based invitation acceptance

- **Rationale**: Prevents unauthorized account activation
- **Trade-off**: Token management complexity vs email-based verification
- **Alternative Considered**: Email verification without tokens

### Data Separation

**Decision**: Extend existing User model with status fields

- **Rationale**: Leverages existing authentication and data structures
- **Trade-off**: Schema evolution vs separate client entity
- **Alternative Considered**: Dedicated Client collection

## Risks / Trade-offs

### Security Risks

- **Unauthorized client creation**: Mitigated by company-only access controls
- **Invitation token exposure**: Short-lived tokens with secure generation
- **Data privacy**: Client data protected by existing access controls

### User Experience

- **Client confusion**: Clear communication about account status and next steps
- **Company overhead**: Streamlined interface for client management
- **Process complexity**: Guided workflows for invitation and activation

### Technical Complexity

- **Authentication flow changes**: Backward compatible with existing users
- **State synchronization**: Consistent status across all systems
- **Email delivery reliability**: Retry mechanisms and status tracking

## Migration Plan

### Phase 1: Data Model Updates

1. Extend User schema with invitation fields
2. Update authentication logic for invited users
3. Add client status tracking

### Phase 2: Company Interface

1. Build client management UI
2. Implement invitation system
3. Update dashboard metrics

### Phase 3: Client Experience

1. Modify signup flow for invitations
2. Add account activation process
3. Update client dashboard for status awareness

### Phase 4: Integration

1. Connect invoice creation to client management
2. Update document delivery for invited clients
3. Comprehensive testing and validation

## Open Questions

1. **Invitation Expiry**: How long should invitations remain valid?
2. **Client Data Requirements**: What minimum information is needed to create a client account?
3. **Notification Preferences**: Should invited clients have default notification settings?
4. **Account Transfer**: What happens if a client already has an account with different credentials?
