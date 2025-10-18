/**
 * Process Handlebars-like template syntax
 */
export function processTemplateSyntax(
  html: string,
  data: Record<string, any>,
): string {
  // Handle {{#each items}} ... {{/each}}
  html = html.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, arrayName, template) => {
      const items = data[arrayName] || [];
      if (!Array.isArray(items) || items.length === 0) return "";

      return items
        .map((item) => {
          let itemHtml = template;
          // Replace variables within the loop
          Object.keys(item).forEach((key) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
            itemHtml = itemHtml.replace(regex, String(item[key]));
          });
          return itemHtml;
        })
        .join("");
    },
  );

  // Handle {{#if condition}} ... {{/if}}
  html = html.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, condition, content) => {
      const value = data[condition];
      if (value && (Array.isArray(value) ? value.length > 0 : value)) {
        return content;
      }
      return "";
    },
  );

  // Handle helper functions like {{formatCurrency value}} or {{formatCurrency (multiply quantity rate)}}
  html = html.replace(
    /\{\{formatCurrency\s+(.+?)\}\}/g,
    (match, expression) => {
      // Check if it's a nested expression like (multiply quantity rate)
      if (expression.startsWith("(") && expression.endsWith(")")) {
        // Evaluate the nested expression first
        const nestedMatch = expression.match(/multiply\s+(\w+)\s+(\w+)/);
        if (nestedMatch) {
          const [, var1, var2] = nestedMatch;
          const val1 = data[var1];
          const val2 = data[var2];
          const result =
            (typeof val1 === "number" ? val1 : 0) *
            (typeof val2 === "number" ? val2 : 0);
          return formatCurrency(result);
        }
      }
      // Simple variable case
      const value = data[expression.trim()];
      return formatCurrency(typeof value === "number" ? value : 0);
    },
  );

  // Handle calculations like {{multiply quantity rate}}
  html = html.replace(
    /\{\{multiply\s+(\w+)\s+(\w+)\}\}/g,
    (match, var1, var2) => {
      const val1 = data[var1];
      const val2 = data[var2];
      const result =
        (typeof val1 === "number" ? val1 : 0) *
        (typeof val2 === "number" ? val2 : 0);
      return String(result);
    },
  );

  return html;
}

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
  }).format(amount);
}
