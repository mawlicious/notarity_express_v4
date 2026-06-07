import type { BookingForm, PriceResponse, Product, Slot } from "../domain/types.js";

export class NotarityClient {
  constructor(private readonly baseUrl: string, private readonly token: string, private readonly slug: string) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const method = init.method ?? "GET";
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          accept: "application/json",
          ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
          ...init.headers
        }
      });
      if (!response.ok) {
        const body = await response.text();
        console.error("Notarity HTTP request failed", {
          method,
          url: url.toString(),
          status: response.status,
          statusText: response.statusText,
          responseBody: body
        });
        throw new Error(`Notarity ${response.status}: ${body}`);
      }
      return response.json() as Promise<T>;
    } catch (error) {
      console.error("Notarity request exception", {
        method,
        url: url.toString(),
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack, cause: error.cause }
          : error
      });
      throw error;
    }
  }

  async fetchForm(): Promise<BookingForm> {
    const form = await this.request<BookingForm>(`/booking-form/slug?slug=${encodeURIComponent(this.slug)}`);
    return { ...form, components: form.components ?? form.pages?.flatMap((page) => page.components) ?? [] };
  }

  fetchProducts(tags: string[]): Promise<Product[]> {
    const params = new URLSearchParams();
    for (const tag of tags) params.append("_tags", tag);
    return this.request(`/products/tags?${params}`);
  }

  async fetchSlots(params: Record<string, string>): Promise<Slot[]> {
    const normalized = { ...params };
    if (normalized.timeslotLabel && !normalized._timeslotLabel) normalized._timeslotLabel = normalized.timeslotLabel;
    if (normalized.timeSlotLabel && !normalized._timeslotLabel) normalized._timeslotLabel = normalized.timeSlotLabel;
    delete normalized.timeslotLabel;
    delete normalized.timeSlotLabel;
    const raw = await this.request<Array<Slot & { startTime?: string; endTime?: string }>>(
      `/appointment-requests/timeslots?${new URLSearchParams(normalized)}`
    );
    return raw.map((slot) => ({
      ...slot,
      startsAt: slot.startsAt ?? slot.startTime ?? "",
      endsAt: slot.endsAt ?? slot.endTime
    }));
  }

  async price(payload: unknown): Promise<PriceResponse> {
    const normalizedPayload = this.normalizeAppointmentPayload(payload);
    const raw = await this.request<PriceResponse["lines"] | Record<string, unknown>>("/appointment-requests/price", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(normalizedPayload)
    });
    const lines = Array.isArray(raw) ? raw : (raw.lines as PriceResponse["lines"]) ?? [];
    const totalMinor = lines.reduce((total, line) => total + Number(line.net ?? 0), 0);
    return { totalMinor, currency: "EUR", lines, confirmedPrice: totalMinor / 100, raw };
  }

  createDraft(form: FormData): Promise<{ id: string }> {
    return this.request("/appointment-request-drafts", { method: "POST", body: form });
  }

  updateDraft(id: string, form: FormData): Promise<{ id: string }> {
    return this.request(`/appointment-request-drafts/${encodeURIComponent(id)}`, { method: "PUT", body: form });
  }

  createDraftFromJson(payload: unknown): Promise<{ id: string }> {
    return this.createDraft(this.toFormData(payload));
  }

  updateDraftFromJson(id: string, payload: unknown): Promise<{ id: string }> {
    return this.updateDraft(id, this.toFormData(payload));
  }

  submit(payload: unknown): Promise<{ id: string; [key: string]: unknown }> {
    const form = new FormData();
    form.append("payload", JSON.stringify({ ...this.normalizeAppointmentPayload(payload), mode: "debug" }));
    return this.request("/appointment-requests", { method: "POST", body: form });
  }

  apiRequest(method: string, path: string, query?: Record<string, string>, body?: unknown): Promise<unknown> {
    if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Notarity API path must be relative and start with /");
    const search = query ? `?${new URLSearchParams(query)}` : "";
    const hasBody = body !== undefined && method !== "GET" && method !== "DELETE";
    return this.request(`${path}${search}`, {
      method,
      ...(hasBody ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {})
    });
  }

  private toFormData(payload: unknown): FormData {
    const form = new FormData();
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      for (const [key, value] of Object.entries(payload)) {
        form.append(key, typeof value === "string" ? value : JSON.stringify(value));
      }
    } else {
      form.append("payload", JSON.stringify(payload));
    }
    return form;
  }

  private normalizeAppointmentPayload(payload: unknown): Record<string, unknown> {
    const source = payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : {};
    const participants = Array.isArray(source.participants)
      ? source.participants.map((value) => this.normalizeParticipant(value))
      : source.participants;
    const products = Array.isArray(source.products)
      ? source.products.map((value) => this.normalizeProduct(value))
      : source.products;
    return {
      ...source,
      ...(participants !== undefined ? { participants } : {}),
      ...(products !== undefined ? { products } : {})
    };
  }

  private normalizeParticipant(value: unknown): Record<string, unknown> {
    const source = value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : { name: String(value ?? "") };
    const fullName = String(source.fullName ?? source.name ?? "").trim();
    const names = fullName.split(/\s+/).filter(Boolean);
    const firstName = String(source.firstName ?? names[0] ?? "").trim();
    const lastName = String(source.lastName ?? names.slice(1).join(" ") ?? "").trim();
    const email = typeof source.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(source.email) && source.email.length <= 100
      ? source.email
      : undefined;
    return {
      firstName,
      lastName,
      ...(email ? { email } : {}),
      client: typeof source.client === "boolean" ? source.client : false
    };
  }

  private normalizeProduct(value: unknown): Record<string, unknown> {
    const source = value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : { id: String(value ?? "") };
    const allowed = [
      "id", "apostille", "userInput", "documentsNotReadyYet", "needHelpDrafting",
      "proofOfRepresentation", "files"
    ];
    return Object.fromEntries(allowed.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
  }
}
