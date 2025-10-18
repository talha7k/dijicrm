import type { DocumentTemplate } from "$lib/types/document";

export interface BasicValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Basic template validation for required fields and simple HTML syntax checking
 */
export function validateBasicTemplate(
  template: DocumentTemplate,
): BasicValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!template.name || template.name.trim().length === 0) {
    errors.push("Template name is required");
  }

  if (template.name && template.name.length > 100) {
    errors.push("Template name must be less than 100 characters");
  }

  if (!template.htmlContent || template.htmlContent.trim().length === 0) {
    errors.push("HTML content is required");
  }

  if (template.htmlContent && template.htmlContent.length > 100000) {
    errors.push("HTML content is too long (maximum 100,000 characters)");
  }

  // Template type validation
  if (
    !template.type ||
    !["order", "legal", "business", "custom"].includes(template.type)
  ) {
    errors.push("Template type must be one of: order, legal, business, custom");
  }

  // Basic HTML syntax checking
  if (template.htmlContent) {
    const htmlValidation = validateBasicHtmlSyntax(template.htmlContent);
    errors.push(...htmlValidation.errors);
    warnings.push(...htmlValidation.warnings);
  }

  // Description validation
  if (template.description && template.description.length > 500) {
    warnings.push(
      "Description should be less than 500 characters for better readability",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Basic HTML syntax validation
 */
function validateBasicHtmlSyntax(htmlContent: string): BasicValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const trimmedContent = htmlContent.trim();

  // Check if content looks like HTML
  if (!trimmedContent.includes("<") || !trimmedContent.includes(">")) {
    warnings.push("Content does not appear to contain HTML tags");
  }

  // Basic tag matching check
  const openTags = (trimmedContent.match(/<[^/][^>]*>/g) || []).filter(
    (tag) =>
      !tag.match(
        /<(br|hr|img|input|meta|link|area|base|col|embed|param|source|track|wbr)[^>]*>/i,
      ) && !tag.includes("</"),
  );

  const closeTags = trimmedContent.match(/<\/[^>]+>/g) || [];

  if (openTags.length > closeTags.length) {
    warnings.push(
      `HTML may have ${openTags.length - closeTags.length} unclosed tag(s)`,
    );
  }

  if (closeTags.length > openTags.length) {
    warnings.push(
      `HTML may have ${closeTags.length - openTags.length} extra closing tag(s)`,
    );
  }

  // Check for common HTML structure issues
  if (trimmedContent.includes("<html") && !trimmedContent.includes("</html>")) {
    warnings.push("HTML tag found but no closing </html> tag");
  }

  if (trimmedContent.includes("<body") && !trimmedContent.includes("</body>")) {
    warnings.push("Body tag found but no closing </body> tag");
  }

  if (trimmedContent.includes("<head") && !trimmedContent.includes("</head>")) {
    warnings.push("Head tag found but no closing </head> tag");
  }

  // Check for potentially dangerous content
  const dangerousPatterns = [
    {
      pattern: /<script[^>]*>[\s\S]*?<\/script>/gi,
      message: "Script tags are not allowed in templates",
    },
    { pattern: /javascript:/gi, message: "JavaScript URLs are not allowed" },
    {
      pattern: /on\w+\s*=/gi,
      message: "Event handlers are not allowed in templates",
    },
    {
      pattern: /<iframe[^>]*>/gi,
      message: "IFrame tags are not allowed in templates",
    },
    {
      pattern: /<object[^>]*>/gi,
      message: "Object tags are not allowed in templates",
    },
    {
      pattern: /<embed[^>]*>/gi,
      message: "Embed tags are not allowed in templates",
    },
  ];

  dangerousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(trimmedContent)) {
      errors.push(message);
    }
  });

  // Check for template variable syntax
  const variablePattern = /\{\{[^}]+\}\}/g;
  const variables = trimmedContent.match(variablePattern) || [];

  if (variables.length > 0) {
    // Check for malformed variables
    variables.forEach((variable) => {
      if (!variable.match(/^\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}$/)) {
        warnings.push(
          `Potentially malformed variable: ${variable}. Variables should use format {{variableName}}`,
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Quick validation for real-time feedback during editing
 */
export function validateTemplateField(
  field: keyof DocumentTemplate,
  value: any,
): BasicValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (field) {
    case "name":
      if (!value || value.trim().length === 0) {
        errors.push("Template name is required");
      } else if (value.length > 100) {
        errors.push("Template name must be less than 100 characters");
      } else if (!value.match(/^[a-zA-Z0-9\s\-_]+$/)) {
        warnings.push(
          "Template name should only contain letters, numbers, spaces, hyphens, and underscores",
        );
      }
      break;

    case "description":
      if (value && value.length > 500) {
        warnings.push("Description should be less than 500 characters");
      }
      break;

    case "htmlContent":
      if (!value || value.trim().length === 0) {
        errors.push("HTML content is required");
      } else if (value.length > 100000) {
        errors.push("HTML content is too long (maximum 100,000 characters)");
      } else {
        const htmlValidation = validateBasicHtmlSyntax(value);
        errors.push(...htmlValidation.errors);
        // Only show warnings for HTML content if it's not empty
        if (value.trim().length > 0) {
          warnings.push(...htmlValidation.warnings);
        }
      }
      break;

    case "type":
      if (!value || !["order", "legal", "business", "custom"].includes(value)) {
        errors.push(
          "Template type must be one of: order, legal, business, custom",
        );
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate template readiness for document generation
 */
export function validateTemplateForGeneration(
  template: DocumentTemplate,
): BasicValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // First run basic validation
  const basicValidation = validateBasicTemplate(template);
  errors.push(...basicValidation.errors);
  warnings.push(...basicValidation.warnings);

  // Additional checks for generation readiness
  if (template.htmlContent) {
    const variablePattern = /\{\{[^}]+\}\}/g;
    const variables = template.htmlContent.match(variablePattern) || [];

    if (variables.length === 0) {
      warnings.push(
        "Template does not contain any variables. Consider adding variables for dynamic content.",
      );
    }

    // Check for variables that might be system variables
    const systemVariablePattern =
      /\{\{(currentDate|currentTime|currentDateTime|orderNumber|totalAmount|subtotal|taxAmount|currency|items|itemCount|orderDate|dueDate|paymentStatus|orderStatus|companyCity|companyCountry|zatcaQRCode|vatNumber|crNumber|documentId|documentType|invoiceTimestamp|discountAmount)\}\}/g;
    const systemVariables =
      template.htmlContent.match(systemVariablePattern) || [];

    if (systemVariables.length > 0) {
      // System variables are good - no warning needed
    } else if (variables.length > 0) {
      warnings.push(
        "Template contains variables but no system variables. Ensure client-specific data will be available.",
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
