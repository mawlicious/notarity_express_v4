export type Language = "en" | "de" | "es";
export type ConditionOperator = "ISDEFINED" | "INCLUDES" | "EQUAL" | "INTERSECTS" | "ISTRUE";

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface FormComponent {
  id: string;
  type: string;
  name?: string;
  required?: boolean;
  hidden?: boolean;
  defaultValue?: unknown;
  conditions?: Condition[];
  components?: FormComponent[];
  _groups?: FormComponent[][];
  [key: string]: unknown;
}

export interface BookingForm {
  id?: string;
  slug: string;
  components: FormComponent[];
  pages?: Array<{ components: FormComponent[]; [key: string]: unknown }>;
}

export interface Product {
  id: string;
  name?: string;
  title?: string | Record<Language, string>;
  description?: string | Record<Language, string>;
  tags?: string[];
  requiredProducts?: string[];
  options?: Array<{ id: string; name: string; required?: boolean }>;
  baseFee?: number;
  pricePerDoc?: number;
  includedDocs?: number;
  showApostille?: boolean;
  apostilleRequired?: boolean;
  apostillePrice?: number;
  showFileUpload?: boolean;
  fileUploadRequired?: boolean;
  showUserInput?: boolean;
  userInputRequired?: boolean;
  showNeedHelpDrafting?: boolean;
  draftingFee?: number;
  showProofOfRepresentation?: boolean;
  proofOfRepresentationPrice?: number;
  hardCopySupported?: boolean;
  instantNotarisationSupported?: boolean;
}

export interface MediaRef {
  id: string;
  path: string;
  mimeType: string;
  originalName?: string;
  expiresAt: string;
}

export interface ExtractedFact {
  field: string;
  value: string;
  confidence: number;
  source: string;
}

export interface BookingState {
  version: 1;
  language: Language;
  phase: "intake" | "collecting" | "confirming" | "ready" | "submitted" | "cancelled" | "draft";
  voiceLed: boolean;
  timezone?: string;
  values: Record<string, unknown>;
  selectedProductIds: string[];
  media: MediaRef[];
  extractedFacts: ExtractedFact[];
  extractionConfirmed: boolean;
  productConfirmed: boolean;
  termsConfirmed: boolean;
  finalConfirmed: boolean;
  unsupportedComponent?: string;
  draftId?: string;
  submissionId?: string;
}

export interface PriceLine {
  name: string;
  _product?: string;
  amount: number;
  pricePerUnit: number;
  net: number;
  identifier?: number;
  pricingEnabled?: boolean;
}

export interface PriceResponse {
  totalMinor: number;
  currency: string;
  lines: PriceLine[];
  confirmedPrice: number;
  raw: unknown;
}

export interface Slot {
  id: string;
  startsAt: string;
  endsAt?: string;
}
