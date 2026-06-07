import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ProfileCipher } from "../src/security/crypto.js";

describe("ProfileCipher", () => {
  it("round trips encrypted convenience data", () => {
    const cipher = new ProfileCipher(randomBytes(32).toString("base64"));
    const encrypted = cipher.encrypt({ email: "ada@example.com" });
    expect(encrypted).not.toContain("ada@example.com");
    expect(cipher.decrypt(encrypted)).toEqual({ email: "ada@example.com" });
  });
});
