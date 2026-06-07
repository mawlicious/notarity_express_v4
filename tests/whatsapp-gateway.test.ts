import { describe, expect, it } from "vitest";
import { normalizeWhatsAppPhone } from "../src/whatsapp/gateway.js";

describe("WhatsApp phone normalization", () => {
  it("normalizes common WhatsApp sender shapes to profile lookup keys", () => {
    expect(normalizeWhatsAppPhone("201090108884@c.us")).toBe("201090108884");
    expect(normalizeWhatsAppPhone("201090108884@s.whatsapp.net")).toBe("201090108884");
    expect(normalizeWhatsAppPhone("+20 109 010 8884")).toBe("201090108884");
    expect(normalizeWhatsAppPhone("201090108884")).toBe("201090108884");
  });

  it("preserves a LID user id as a usable alias key when phone resolution is unavailable", () => {
    expect(normalizeWhatsAppPhone("140179243274463@lid")).toBe("140179243274463");
  });
});
