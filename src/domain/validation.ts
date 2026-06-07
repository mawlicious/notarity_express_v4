import { z } from "zod";
import type { BookingState } from "./types.js";

const email = z.string().email();

export function validateForSubmission(state: BookingState): string[] {
  const errors: string[] = [];
  if (!state.selectedProductIds.length) errors.push("At least one product is required");
  if (!state.productConfirmed) errors.push("Product recommendation must be confirmed");
  if (!state.termsConfirmed) errors.push("Terms must be confirmed");
  if (!state.finalConfirmed) errors.push("Final submission must be explicitly confirmed");
  if (state.unsupportedComponent) errors.push(`Unsupported component: ${state.unsupportedComponent}`);
  const contactEmail = state.values.contactEmail;
  if (contactEmail && !email.safeParse(contactEmail).success) errors.push("Contact email is invalid");
  return errors;
}
