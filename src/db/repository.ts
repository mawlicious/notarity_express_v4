import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import type { BookingState } from "../domain/types.js";
import { ProfileCipher } from "../security/crypto.js";

const claimMessage = makeFunctionReference<"mutation", { messageId: string; phone: string }, boolean>("agent:claimMessage");
const getSession = makeFunctionReference<"query", { phone: string }, { state: unknown; updatedAt: number } | null>("agent:getSession");
const saveSession = makeFunctionReference<"mutation", { phone: string; state: BookingState }, null>("agent:saveSession");
const deleteSession = makeFunctionReference<"mutation", { phone: string }, null>("agent:deleteSession");
const forget = makeFunctionReference<"mutation", { phone: string }, null>("agent:forget");
const submissionCount = makeFunctionReference<"query", { phone: string }, number>("agent:successfulSubmissionCount");
const getConvenienceProfile = makeFunctionReference<"query", { phone: string }, string | null>("agent:getConvenienceProfile");
const saveConvenienceProfile = makeFunctionReference<"mutation", { phone: string; encryptedProfile: string }, null>("agent:saveConvenienceProfile");

const phoneAliases = (phone: string): string[] => {
  const aliases = new Set<string>([phone]);
  const withoutChatSuffix = phone.split("@")[0] ?? phone;
  aliases.add(withoutChatSuffix);
  const digits = withoutChatSuffix.replace(/\D/g, "");
  if (digits) aliases.add(digits);
  if (digits && phone.trim().startsWith("+")) aliases.add(`+${digits}`);
  return [...aliases].filter(Boolean);
};

export class Repository {
  private readonly cipher: ProfileCipher;

  constructor(private readonly client: ConvexHttpClient, encryptionKeyBase64: string) {
    this.cipher = new ProfileCipher(encryptionKeyBase64);
  }

  claimMessage(messageId: string, phone: string): Promise<boolean> {
    return this.client.mutation(claimMessage, { messageId, phone });
  }

  async getSession(phone: string): Promise<{ state: BookingState; updatedAt: Date } | null> {
    const result = await this.client.query(getSession, { phone });
    return result ? { state: result.state as BookingState, updatedAt: new Date(result.updatedAt) } : null;
  }

  async saveSession(phone: string, state: BookingState): Promise<void> {
    await this.client.mutation(saveSession, { phone, state });
  }

  async deleteSession(phone: string): Promise<void> {
    await this.client.mutation(deleteSession, { phone });
  }

  async forget(phone: string): Promise<void> {
    await this.client.mutation(forget, { phone });
  }

  successfulSubmissionCount(phone: string): Promise<number> {
    return this.client.query(submissionCount, { phone });
  }

  async getConvenienceProfile<T>(phone: string): Promise<T | null> {
    for (const alias of phoneAliases(phone)) {
      const encrypted = await this.client.query(getConvenienceProfile, { phone: alias });
      if (encrypted) return this.cipher.decrypt<T>(encrypted);
    }
    return null;
  }

  saveConvenienceProfile(phone: string, profile: unknown): Promise<null> {
    const normalizedPhone = phoneAliases(phone).find((alias) => /^\d+$/.test(alias)) ?? phone;
    return this.client.mutation(saveConvenienceProfile, {
      phone: normalizedPhone,
      encryptedProfile: this.cipher.encrypt(profile)
    });
  }
}
