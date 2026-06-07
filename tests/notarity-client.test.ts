import { afterEach, describe, expect, it, vi } from "vitest";
import { NotarityClient } from "../src/clients/notarity.js";

describe("NotarityClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes model-generated participant and product fields before pricing", async () => {
    const fetchMock = vi.fn(async (_url: URL, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body));
      expect(payload.participants).toEqual([{
        email: "daniel.weber@alpinerobotics.example",
        client: false
      }]);
      expect(payload.products).toEqual([{
        id: "poa",
        apostille: true,
        documentsNotReadyYet: false,
        needHelpDrafting: false,
        files: []
      }]);
      expect(payload.newsletter).toBe(false);
      expect(payload._bookingForm).toBe("booking-form-id");
      return new Response(JSON.stringify([{ name: "POA", amount: 1, pricePerUnit: 10000, net: 10000 }]), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new NotarityClient("https://staging-api.notarity.com", "", "test");

    const result = await client.price({
      _bookingForm: "booking-form-id",
      participants: [{
        name: "Daniel Weber",
        role: "Managing Director",
        country: "Austria",
        email: "daniel.weber@alpinerobotics.example",
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

  it("normalizes timeslot ids and saved billing aliases for submission", async () => {
    const fetchMock = vi.fn(async (_url: URL, init?: RequestInit) => {
      const form = init?.body as FormData;
      const payload = JSON.parse(String(form.get("payload")));
      expect(payload.timeslots).toEqual(["slot-123"]);
      expect(payload.billingDetails).toMatchObject({
        firstName: "Meridian",
        lastName: "Ventures",
        address: "12 Nile View Tower",
        zipCode: "11511",
        city: "Cairo",
        countryCode: "EG"
      });
      expect(payload.contactDetails).toEqual({ contactDetailsSameAsBillingDetails: true });
      return new Response(JSON.stringify({ id: "request-1" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new NotarityClient("https://staging-api.notarity.com", "", "test");

    await client.submit({
      _bookingForm: "booking-form-id",
      timeslots: [{ id: "slot-123", startTime: "2026-06-08T08:00:00.000Z" }],
      billingDetails: {
        name: "Meridian Ventures",
        street: "12 Nile View Tower",
        postalCode: "11511",
        city: "Cairo",
        country: "Egypt"
      },
      contactDetails: "SameAsBillingDetails"
    });
  });

  it("normalizes generic product tag lookups to the Notarity _tags query shape", async () => {
    const fetchMock = vi.fn(async (url: URL) => {
      expect(url.pathname).toBe("/products/tags");
      expect(url.searchParams.getAll("_tags")).toEqual(["5DVjVha92EJnyyO6138f"]);
      expect(url.searchParams.has("tags")).toBe(false);
      return new Response(JSON.stringify([{ id: "product-1" }]), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new NotarityClient("https://staging-api.notarity.com", "", "test");

    await client.apiRequest("GET", "/products/tags", { tags: "5DVjVha92EJnyyO6138f" });
  });
});
