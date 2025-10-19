## Why

The client detail page currently allows users to select document templates but doesn't actually generate documents with client information. Users need the ability to generate personalized documents using existing templates and client data directly from the client detail page.

## What Changes

- Add document generation functionality to DocumentSendModal that populates templates with client data
- Create client data mapping function to transform client profile into template variables
- Add preview functionality before sending generated documents
- Enhance document generation to support client-specific placeholders
- Add loading states and error handling for document generation process

## Impact

- Affected specs: document-generation, client-dashboard
- Affected code: DocumentSendModal.svelte, document generation API, client data utilities
- New capability: Generate personalized documents for clients directly from client detail page
