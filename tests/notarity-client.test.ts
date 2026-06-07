import { afterEach, describe, expect, it, vi } from "vitest";
import { NotarityClient } from "../src/clients/notarity.js";

describe("NotarityClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes model-generated participant and product fields before pricing", async () => {
    const fetchMock = vi.fn(async (_url: URL, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body));
      expect(payload.participants).toEqual([{
        firstName: "Daniel",
        lastName: "Weber",
        client: false
      }]);
      expect(payload.products).toEqual([{
        id: "poa",
        apostille: true,
        documentsNotReadyYet: false,
        needHelpDrafting: false,
        files: []
      }]);
      return new Response(JSON.stringify([{ name: "POA", amount: 1, pricePerUnit: 10000, net: 10000 }]), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new NotarityClient("https://staging-api.notarity.com", "", "test");

    const result = await client.price({
      participants: [{
        name: "Daniel Weber",
        role: "Managing Director",
        country: "Austria",
        email: "not-an-email",
        client: undefined
      }],
      products: [{
        id: "poa",
        quantity: 1,
        apostille: true,
        documentsNotReadyYet: false,
        needHelpDrafting: false,
        files: []
      }]
    });

    expect(result.confirmedPrice).toBe(100);
  });
});
