<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import * as Select from "$lib/components/ui/select";
  import * as Card from "$lib/components/ui/card/index.js";
  import { getDocumentTemplate } from "$lib/stores/documentTemplates";
  import { mapClientDataToTemplate } from "$lib/utils/client-data-mapping";
  import { get } from "svelte/store";
  import { companyContext } from "$lib/stores/companyContext";
  import type { DocumentTemplate, TemplatePlaceholder } from "$lib/types/document";
  import type { UserProfile } from "$lib/types/user";

  interface Props {
    selectedTemplateIds: string[];
    client: UserProfile | null;
    orders: any[];
    selectedOrderId: string;
    onOrderIdChange: (orderId: string) => void;
    onTemplateDataChange: (data: Record<string, any>) => void;
    onValidationChange?: (state: { isValid: boolean; missingFields: string[]; requiresOrder: boolean; orderSelected: boolean }) => void;
    onPerTemplateValidationChange?: (states: Record<string, { isValid: boolean; missingFields: string[]; requiresOrder: boolean; orderSelected: boolean }>) => void;
    mode?: 'unified' | 'per-template'; // New mode prop
  }

  let {
    selectedTemplateIds,
    client,
    orders,
    selectedOrderId,
    onOrderIdChange,
    onTemplateDataChange,
    onValidationChange,
    onPerTemplateValidationChange,
    mode = 'unified',
  }: Props = $props();

  let additionalFields = $state<Record<string, string>>({});
  let missingFields = $state<Array<{ key: string; label: string; type: string; description?: string }>>([]);
  let templateRequirements = $state<{
    requiresOrder: boolean;
    orderType?: 'invoice' | 'quote' | 'general';
  }>({ requiresOrder: false });

  // For per-template mode
  let templateSpecificData = $state<Record<string, Record<string, string>>>({});
  let templateDetails = $state<Array<{ id: string; name: string; type: string; missingFields: any[] }>>([]);

  // Template type configurations
  const templateTypeConfigs = {
    order: {
      requiresOrder: true,
      orderType: 'invoice' as const,
      description: 'Order templates (invoices/quotes) require order selection for accurate billing information'
    },
    legal: {
      requiresOrder: false,
      description: 'Legal document templates may require additional information'
    },
    business: {
      requiresOrder: false,
      description: 'Business document templates may require additional information'
    },
    custom: {
      requiresOrder: false,
      description: 'Custom templates may have specific requirements'
    }
  };

  // Check template requirements whenever selection changes
  $effect(() => {
    if (selectedTemplateIds.length === 0 || !client) {
      missingFields = [];
      templateRequirements = { requiresOrder: false };
      templateDetails = [];
      updateTemplateData();
      return;
    }

    (async () => {
      try {
        const companyId = get(companyContext).data?.companyId;
        const selectedOrder = orders.find(o => o.id === selectedOrderId);
        const baseTemplateData = mapClientDataToTemplate(client, selectedOrder);
      
      if (mode === 'per-template') {
        // Per-template mode: analyze each template individually
        const details = [];
        
        for (const templateId of selectedTemplateIds) {
          const template = await getDocumentTemplate(templateId, companyId || undefined);
          if (!template) continue;

          const templateMissingFields = template.placeholders
            ?.filter(placeholder => {
              const isRequired = placeholder.required;
              const hasData = placeholder.key in baseTemplateData;
              return isRequired && !hasData;
            })
            .map(placeholder => ({
              key: placeholder.key,
              label: placeholder.label,
              type: placeholder.type,
              description: placeholder.description
            })) || [];

          details.push({
            id: templateId,
            name: template.name,
            type: template.type,
            missingFields: templateMissingFields
          });

          // Initialize template-specific data if not exists
          if (!templateSpecificData[templateId]) {
            templateSpecificData[templateId] = {};
          }
        }

        templateDetails = details;
        
        // Check if any template requires order
        const requiresOrder = details.some(detail => {
          const typeConfig = templateTypeConfigs[detail.type as keyof typeof templateTypeConfigs];
          return typeConfig?.requiresOrder;
        });
        
        templateRequirements = { requiresOrder };
        console.log("📋 [TEMPLATE DATA FORM] Per-template mode - requiresOrder:", requiresOrder);
        console.log("📋 [TEMPLATE DATA FORM] Template details:", details);

         // Calculate per-template validation states
         const perTemplateStates: Record<string, { isValid: boolean; missingFields: string[]; requiresOrder: boolean; orderSelected: boolean }> = {};
         
         for (const detail of details) {
           const typeConfig = templateTypeConfigs[detail.type as keyof typeof templateTypeConfigs];
           const templateRequiresOrder = typeConfig?.requiresOrder || false;
           const missingFieldsList = detail.missingFields.map(f => f.label || f.key);
           const orderSelected = !templateRequiresOrder || !!selectedOrderId;
           const isValid = missingFieldsList.length === 0 && orderSelected;
           
           perTemplateStates[detail.id] = {
             isValid,
             missingFields: missingFieldsList,
             requiresOrder: templateRequiresOrder,
             orderSelected
           };
         }

         // Emit per-template validation states
         if (onPerTemplateValidationChange) {
           onPerTemplateValidationChange(perTemplateStates);
         }

         // Also emit unified validation for backward compatibility
         const allMissingFields = details.flatMap(detail => detail.missingFields.map(f => f.label || f.key));
         const orderSelected = !requiresOrder || !!selectedOrderId;
         const isValid = details.every(detail => {
           const state = perTemplateStates[detail.id];
           return state.isValid;
         });

         if (onValidationChange) {
           onValidationChange({
             isValid,
             missingFields: allMissingFields,
             requiresOrder,
             orderSelected
           });
         }
      } else {
        // Unified mode: combine all requirements
        let requiresOrder = false;
        let orderType: 'invoice' | 'quote' | 'general' = 'general';
        const allRequiredFields = new Map<string, { label: string; type: string; description?: string }>();
        
        for (const templateId of selectedTemplateIds) {
          const template = await getDocumentTemplate(templateId, companyId || undefined);
          if (!template) continue;

          // Check template type requirements
          const typeConfig = templateTypeConfigs[template.type as keyof typeof templateTypeConfigs];
          if (typeConfig?.requiresOrder) {
            requiresOrder = true;
            if ('orderType' in typeConfig && typeConfig.orderType) {
              orderType = typeConfig.orderType;
            }
          }

          // Collect required placeholders
          if (template.placeholders) {
            template.placeholders
              .filter(placeholder => placeholder.required && !(placeholder.key in baseTemplateData))
              .forEach(placeholder => {
                allRequiredFields.set(placeholder.key, {
                  label: placeholder.label,
                  type: placeholder.type,
                  description: placeholder.description
                });
              });
          }
        }

        missingFields = Array.from(allRequiredFields.entries()).map(([key, data]) => ({
          key,
          ...data
        }));

        templateRequirements = { requiresOrder, orderType };
        console.log("📋 [TEMPLATE DATA FORM] Unified mode - requiresOrder:", requiresOrder);
        console.log("📋 [TEMPLATE DATA FORM] Order type:", orderType);

        // Calculate validation state
        const missingFieldsList = Array.from(allRequiredFields.entries()).map(([key, data]) => data.label || key);
        const orderSelected = !requiresOrder || !!selectedOrderId;
        const isValid = missingFieldsList.length === 0 && orderSelected;

        if (onValidationChange) {
          onValidationChange({
            isValid,
            missingFields: missingFieldsList,
            requiresOrder,
            orderSelected
          });
        }
      }
      
        updateTemplateData();
      } catch (error) {
        console.error("Error analyzing template requirements:", error);
        missingFields = [];
        templateRequirements = { requiresOrder: false };
        templateDetails = [];
      }
    })();
  });

  // Update template data when additional fields change
  $effect(() => {
    updateTemplateData();
  });

  // Update template data when template-specific data changes
  $effect(() => {
    // Debounce template data updates to avoid infinite loops
    const timeout = setTimeout(() => {
      updateTemplateData();
    }, 50);
    
    return () => clearTimeout(timeout);
  });

  // Track previous validation states to avoid infinite loops
  let previousValidationStates = $state<Record<string, { isValid: boolean; missingFields: string[]; requiresOrder: boolean; orderSelected: boolean }>>({});

  // Recalculate validation when template-specific data changes (for per-template mode)
  $effect(() => {
    if (mode === 'per-template' && templateDetails.length > 0) {
      console.log("📋 [TEMPLATE DATA FORM] Recalculating validation due to templateSpecificData change");
      
      const perTemplateStates: Record<string, { isValid: boolean; missingFields: string[]; requiresOrder: boolean; orderSelected: boolean }> = {};
      
      for (const detail of templateDetails) {
        const typeConfig = templateTypeConfigs[detail.type as keyof typeof templateTypeConfigs];
        const templateRequiresOrder = typeConfig?.requiresOrder || false;
        
        // Check which required fields are still missing based on actual form data
        const stillMissingFields: string[] = [];
        
        for (const field of detail.missingFields) {
          const fieldValue = templateSpecificData[detail.id]?.[field.key];
          const hasValue = fieldValue && fieldValue.trim() !== '';
          
          if (!hasValue) {
            stillMissingFields.push(field.label || field.key);
          }
        }
        
        const orderSelected = !templateRequiresOrder || !!selectedOrderId;
        const isValid = stillMissingFields.length === 0 && orderSelected;
        
        perTemplateStates[detail.id] = {
          isValid,
          missingFields: stillMissingFields,
          requiresOrder: templateRequiresOrder,
          orderSelected
        };
      }

      // Check if validation states actually changed to avoid infinite loops
      const statesChanged = JSON.stringify(perTemplateStates) !== JSON.stringify(previousValidationStates);
      
      if (statesChanged) {
        console.log("📋 [TEMPLATE DATA FORM] Validation states changed, emitting updates");
        previousValidationStates = perTemplateStates;

        // Emit updated per-template validation states
        if (onPerTemplateValidationChange) {
          onPerTemplateValidationChange(perTemplateStates);
        }

        // Also emit unified validation for backward compatibility
        const requiresOrder = templateDetails.some(detail => {
          const typeConfig = templateTypeConfigs[detail.type as keyof typeof templateTypeConfigs];
          return typeConfig?.requiresOrder;
        });
        
        const allMissingFields = templateDetails.flatMap(detail => 
          perTemplateStates[detail.id].missingFields
        );
        const orderSelected = !requiresOrder || !!selectedOrderId;
        const isValid = templateDetails.every(detail => {
          const state = perTemplateStates[detail.id];
          return state.isValid;
        });

        if (onValidationChange) {
          onValidationChange({
            isValid,
            missingFields: allMissingFields,
            requiresOrder,
            orderSelected
          });
        }
      } else {
        console.log("📋 [TEMPLATE DATA FORM] Validation states unchanged, skipping emit");
      }
    }
  });

  function updateTemplateData() {
    if (!client) return;

    const selectedOrder = orders.find(o => o.id === selectedOrderId);
    const baseTemplateData = mapClientDataToTemplate(client, selectedOrder);
    
    if (mode === 'per-template') {
      // For per-template mode, combine all template-specific data
      const combinedData = { ...baseTemplateData };
      
      // Merge all template-specific data, with later templates taking precedence
      for (const [templateId, templateData] of Object.entries(templateSpecificData)) {
        Object.assign(combinedData, templateData);
      }
      
      onTemplateDataChange(combinedData);
    } else {
      // Unified mode: use additional fields
      const templateData = { ...baseTemplateData, ...additionalFields };
      onTemplateDataChange(templateData);
    }
  }

  function handleTemplateFieldChange(templateId: string, fieldKey: string, value: string) {
    if (!templateSpecificData[templateId]) {
      templateSpecificData[templateId] = {};
    }
    
    // Only update if the value actually changed
    const currentValue = templateSpecificData[templateId][fieldKey];
    if (currentValue !== value) {
      templateSpecificData[templateId][fieldKey] = value;
      // Don't call updateTemplateData() here - let the effect handle it
      // updateTemplateData();
    }
  }

  function handleFieldChange(key: string, value: string) {
    additionalFields[key] = value;
    updateTemplateData();
  }

  function isOrderTypeTemplate(templateId: string): boolean {
    // This would ideally check the template type, but for now use name-based detection
    return false; // Will be handled by template type analysis
  }

  function getFieldInputType(type: string): string {
    switch (type) {
      case 'number':
      case 'currency':
        return 'number';
      case 'date':
        return 'date';
      case 'email':
        return 'email';
      case 'tel':
        return 'tel';
      case 'url':
        return 'url';
      default:
        return 'text';
    }
  }

  function formatFieldLabel(key: string, label?: string): string {
    if (label) return label;
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  }

  function getFieldPlaceholder(key: string, type: string): string {
    const basePlaceholder = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    
    switch (type) {
      case 'number':
        return `Enter ${basePlaceholder}`;
      case 'currency':
        return `Enter amount (${basePlaceholder})`;
      case 'date':
        return `Select ${basePlaceholder}`;
      case 'email':
        return `Enter email address`;
      case 'tel':
        return `Enter phone number`;
      case 'url':
        return `Enter website URL`;
      default:
        return `Enter ${basePlaceholder}`;
    }
  }
</script>

    <!-- Order Selection (shown when any template requires an order) -->
    {#if templateRequirements.requiresOrder}
      {@const debugInfo = console.log("📋 [TEMPLATE DATA FORM] Rendering order selection - requiresOrder:", templateRequirements.requiresOrder)}
      <Card.Root class="mb-6">
        <Card.Header>
          <Card.Title class="text-base">Order Selection</Card.Title>
          <Card.Description class="text-sm text-muted-foreground">
            Select an order to populate invoice/quote information
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="space-y-2">
            <Label for="order-select">Select Order</Label>
            <Select.Root type="single" bind:value={selectedOrderId}>
              <Select.Trigger id="order-select" class="w-full">
                {selectedOrderId ? orders.find(o => o.id === selectedOrderId)?.orderNumber || selectedOrderId : "Choose an order..."}
              </Select.Trigger>
              <Select.Content>
                {#each orders as order}
                  <Select.Item value={order.id}>
                    {order.orderNumber || order.id} - {order.status || 'Unknown'} 
                    {#if order.totalAmount}
                      (${order.totalAmount})
                    {/if}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            {#if templateRequirements.orderType}
              <p class="text-xs text-muted-foreground">
                Order type required: {templateRequirements.orderType}
              </p>
            {/if}
          </div>
        </Card.Content>
      </Card.Root>
    {/if}

    {#if mode === 'per-template' && templateDetails.length > 0}
  <!-- Per-Template Mode -->
  {#each templateDetails as template}
    {#if template.missingFields.length > 0}
      <Card.Root class="mb-6">
        <Card.Header>
          <Card.Title class="text-base">{template.name} - Additional Information</Card.Title>
          <Card.Description class="text-sm text-muted-foreground">
            Type: {template.type} • {template.missingFields.length} field{template.missingFields.length === 1 ? '' : 's'} required
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          {#each template.missingFields as field}
            <div class="space-y-2">
              <Label for="template-{template.id}-field-{field.key}">
                {formatFieldLabel(field.key, field.label)}
              </Label>
              {#if field.type === 'text' && field.key.toLowerCase().includes('description')}
                <Textarea
                  id="template-{template.id}-field-{field.key}"
                  value={templateSpecificData[template.id]?.[field.key] || ''}
                  oninput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    if (target) handleTemplateFieldChange(template.id, field.key, target.value);
                  }}
                  placeholder={getFieldPlaceholder(field.key, field.type)}
                  rows={3}
                />
              {:else}
                <Input
                  id="template-{template.id}-field-{field.key}"
                  type={getFieldInputType(field.type)}
                  value={templateSpecificData[template.id]?.[field.key] || ''}
                  oninput={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target) handleTemplateFieldChange(template.id, field.key, target.value);
                  }}
                  placeholder={getFieldPlaceholder(field.key, field.type)}
                />
              {/if}
              {#if field.description}
                <p class="text-xs text-muted-foreground">{field.description}</p>
              {/if}
            </div>
          {/each}
        </Card.Content>
      </Card.Root>
    {/if}
  {/each}
{:else if mode === 'unified'}
  <!-- Unified Mode - Order Selection (shown when required) -->
  {#if templateRequirements.requiresOrder}
    <Card.Root class="mb-6">
      <Card.Header>
        <Card.Title class="text-base">Order Selection</Card.Title>
        <Card.Description class="text-sm text-muted-foreground">
          Select an order to populate invoice/quote information
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="space-y-2">
          <Label for="order-select">Select Order</Label>
          <Select.Root type="single" bind:value={selectedOrderId}>
            <Select.Trigger id="order-select" class="w-full">
              {selectedOrderId ? orders.find(o => o.id === selectedOrderId)?.orderNumber || selectedOrderId : "Choose an order..."}
            </Select.Trigger>
            <Select.Content>
              {#each orders as order}
                <Select.Item value={order.id}>
                  {order.orderNumber || order.id} - {order.status || 'Unknown'} 
                  {#if order.totalAmount}
                    (${order.totalAmount})
                  {/if}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          {#if templateRequirements.orderType}
            <p class="text-xs text-muted-foreground">
              Order type required: {templateRequirements.orderType}
            </p>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
  {#if missingFields.length > 0}
    <Card.Root class="mb-6">
      <Card.Header>
        <Card.Title class="text-base">Additional Information Required</Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-sm text-muted-foreground mb-4">
          Please provide the following information to complete the document generation:
        </p>
        <div class="space-y-4">
          {#each missingFields as field}
            <div class="space-y-2">
              <Label for="field-{field.key}">
                {formatFieldLabel(field.key, field.label)}
              </Label>
              {#if field.type === 'text' && field.key.toLowerCase().includes('description')}
                <Textarea
                  id="field-{field.key}"
                  bind:value={additionalFields[field.key]}
                  placeholder={getFieldPlaceholder(field.key, field.type)}
                  rows={3}
                />
              {:else}
                <Input
                  id="field-{field.key}"
                  type={getFieldInputType(field.type)}
                  bind:value={additionalFields[field.key]}
                  placeholder={getFieldPlaceholder(field.key, field.type)}
                />
              {/if}
              {#if field.description}
                <p class="text-xs text-muted-foreground">{field.description}</p>
              {/if}
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
{/if}