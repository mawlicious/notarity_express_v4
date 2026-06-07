import { describe, expect, it, vi } from "vitest";
import { FormCache } from "../src/clients/form-cache.js";

describe("FormCache staging behavior", () => {
  it("normalizes pages and requests the product tags referenced by conditions", async () => {
    const client = {
      fetchForm: vi.fn(async () => ({
        slug: "test",
        components: [{
          id: "condition",
          type: "condition",
          props: { components: [{ id: "picker", type: "productPicker", props: { tags: ["tag-a", "tag-b"] } }] }
        }]
      })),
      fetchProducts: vi.fn(async () => [])
    };
    const cache = new FormCache(client as never, 1000);
    await cache.refresh();
    expect(client.fetchProducts).toHaveBeenCalledWith(["tag-a", "tag-b"]);
  });

  it("keeps the public form available when protected products return 403", async () => {
    const client = {
      fetchForm: vi.fn(async () => ({ slug: "test", components: [] })),
      fetchProducts: vi.fn(async () => { throw new Error("Notarity 403: must be admin"); })
    };
    const cache = new FormCache(client as never, 1000);
    await cache.refresh();
    expect(cache.form?.slug).toBe("test");
    expect(cache.products).toEqual([]);
  });
});
