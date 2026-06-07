import type { BookingState, Language } from "./types.js";

export const newBookingState = (language: Language = "en"): BookingState => ({
  version: 1,
  language,
  phase: "intake",
  voiceLed: false,
  values: { newsletter: false },
  selectedProductIds: [],
  media: [],
  extractedFacts: [],
  extractionConfirmed: false,
  productConfirmed: false,
  termsConfirmed: false,
  finalConfirmed: false
});

export const sessionExpired = (updatedAt: Date, now = new Date()) =>
  now.getTime() - updatedAt.getTime() >= 24 * 60 * 60 * 1000;

export const memoryEnabled = (successfulSubmissions: number) => successfulSubmissions >= 3;
