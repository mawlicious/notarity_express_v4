import { describe, expect, it } from "vitest";
import { normalizeWhatsAppPhone } from "../src/whatsapp/gateway.js";

describe("WhatsApp phone normalization", () => {
  it("normalizes common WhatsApp sender shapes to profile lookup keys", () => {
    expect(normalizeWhatsAppPhone("201090108884@c.us")).toBe("201090108884");
    expect(normalizeWhatsAppPhone("+20 109 010 8884")).toBe("201090108884");
    expect(normalizeWhatsAppPhone("201090108884")).toBe("201090108884");
  });
});
