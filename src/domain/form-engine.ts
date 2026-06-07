import { conditionsMatch } from "./conditions.js";
import type { BookingForm, FormComponent } from "./types.js";

export const SUPPORTED_COMPONENTS = new Set([
  "countryPicker", "productPicker", "singleProduct", "participants", "timeSlots",
  "billingDetails", "contactDetails", "hardCopy", "shippingDetails", "summary",
  "preferredNotary", "newsletter", "confirmTC", "hidden"
]);

function children(component: FormComponent): FormComponent[] {
  return [
    ...(component.components ?? []),
    ...(component._groups ?? []).flat()
  ];
}

export function flattenComponents(components: FormComponent[]): FormComponent[] {
  return components.flatMap((component) => [component, ...flattenComponents(children(component))]);
}

export function applyHiddenDefaults(form: BookingForm, values: Record<string, unknown>): Record<string, unknown> {
  const next = { ...values };
  for (const component of flattenComponents(form.components)) {
    if ((component.hidden || component.type === "hidden") && component.name && component.defaultValue !== undefined) {
      next[component.name] ??= component.defaultValue;
    }
  }
  return next;
}

export function visibleComponents(form: BookingForm, values: Record<string, unknown>): FormComponent[] {
  return flattenComponents(form.components).filter((component) =>
    !component.hidden && component.type !== "hidden" && conditionsMatch(component.conditions, values)
  );
}

export function firstUnsupported(form: BookingForm, values: Record<string, unknown>): FormComponent | undefined {
  return visibleComponents(form, values).find((component) => !SUPPORTED_COMPONENTS.has(component.type));
}

export function missingRequired(form: BookingForm, values: Record<string, unknown>): FormComponent[] {
  return visibleComponents(form, values).filter((component) => {
    if (!component.required || !component.name) return false;
    const value = values[component.name];
    return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
  });
}
