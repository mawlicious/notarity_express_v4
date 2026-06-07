import type { BookingForm, Product } from "../domain/types.js";
import type { NotarityClient } from "./notarity.js";

export class FormCache {
  form?: BookingForm;
  products: Product[] = [];
  lastRefreshError?: unknown;
  private timer?: NodeJS.Timeout;

  constructor(private readonly client: NotarityClient, private readonly intervalMs: number) {}

  async refresh(): Promise<void> {
    try {
      const form = await this.client.fetchForm();
      const tags = this.collectTags(form.components);
      this.form = form;
      this.products = await this.client.fetchProducts(tags);
      this.lastRefreshError = undefined;
    } catch (error) {
      this.lastRefreshError = error;
      console.warn("Notarity form cache refresh failed; live booking data will be retried later", error);
    }
  }

  async start(): Promise<void> {
    await this.refresh();
    this.timer = setInterval(() => {
      void this.refresh();
    }, this.intervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private collectTags(components: BookingForm["components"]): string[] {
    const tags = new Set<string>();
    const visit = (items: BookingForm["components"]) => {
      for (const component of items) {
        const props = component.props as { tags?: string[]; components?: BookingForm["components"]; elseComponents?: BookingForm["components"] } | undefined;
        for (const tag of props?.tags ?? []) tags.add(tag);
        visit(props?.components ?? []);
        visit(props?.elseComponents ?? []);
        visit(component.components ?? []);
      }
    };
    visit(components);
    return [...tags];
  }
}
