import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const claimMessage = mutation({
  args: { messageId: v.string(), phone: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("processedMessages")
      .withIndex("by_message_id", (q) => q.eq("messageId", args.messageId)).unique();
    if (existing) return false;
    await ctx.db.insert("processedMessages", { ...args, processedAt: Date.now() });
    return true;
  }
});

export const getSession = query({
  args: { phone: v.string() },
  returns: v.union(v.null(), v.object({ state: v.any(), updatedAt: v.number() })),
  handler: async (ctx, { phone }) => {
    const session = await ctx.db.query("sessions").withIndex("by_phone", (q) => q.eq("phone", phone)).unique();
    if (!session || session.expiresAt <= Date.now()) return null;
    return { state: session.state, updatedAt: session.updatedAt };
  }
});

export const saveSession = mutation({
  args: { phone: v.string(), state: v.any() },
  returns: v.null(),
  handler: async (ctx, { phone, state }) => {
    const now = Date.now();
    const user = await ctx.db.query("users").withIndex("by_phone", (q) => q.eq("phone", phone)).unique();
    if (!user) await ctx.db.insert("users", { phone, successfulSubmissions: 0, createdAt: now, updatedAt: now });
    const session = await ctx.db.query("sessions").withIndex("by_phone", (q) => q.eq("phone", phone)).unique();
    const value = { phone, state, expiresAt: now + 86_400_000, updatedAt: now };
    if (session) await ctx.db.replace(session._id, value);
    else await ctx.db.insert("sessions", value);
    return null;
  }
});

export const deleteSession = mutation({
  args: { phone: v.string() },
  returns: v.null(),
  handler: async (ctx, { phone }) => {
    const session = await ctx.db.query("sessions").withIndex("by_phone", (q) => q.eq("phone", phone)).unique();
    if (session) await ctx.db.delete(session._id);
    return null;
  }
});

export const forget = mutation({
  args: { phone: v.string() },
  returns: v.null(),
  handler: async (ctx, { phone }) => {
    const deletions = await Promise.all([
      ctx.db.query("users").withIndex("by_phone", (q) => q.eq("phone", phone)).collect(),
      ctx.db.query("styleProfiles").withIndex("by_phone", (q) => q.eq("phone", phone)).collect(),
      ctx.db.query("convenienceProfiles").withIndex("by_phone", (q) => q.eq("phone", phone)).collect(),
      ctx.db.query("sessions").withIndex("by_phone", (q) => q.eq("phone", phone)).collect(),
      ctx.db.query("sessionEvents").withIndex("by_phone_and_created_at", (q) => q.eq("phone", phone)).collect(),
      ctx.db.query("submissions").withIndex("by_phone", (q) => q.eq("phone", phone)).collect()
    ]);
    await Promise.all(deletions.flat().map((doc) => ctx.db.delete(doc._id)));
    return null;
  }
});

export const successfulSubmissionCount = query({
  args: { phone: v.string() },
  returns: v.number(),
  handler: async (ctx, { phone }) => {
    const user = await ctx.db.query("users").withIndex("by_phone", (q) => q.eq("phone", phone)).unique();
    return user?.successfulSubmissions ?? 0;
  }
});

export const getConvenienceProfile = query({
  args: { phone: v.string() },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, { phone }) => {
    const profile = await ctx.db.query("convenienceProfiles")
      .withIndex("by_phone", (q) => q.eq("phone", phone)).unique();
    return profile?.encryptedProfile ?? null;
  }
});

export const saveConvenienceProfile = mutation({
  args: { phone: v.string(), encryptedProfile: v.string() },
  returns: v.null(),
  handler: async (ctx, { phone, encryptedProfile }) => {
    const existing = await ctx.db.query("convenienceProfiles")
      .withIndex("by_phone", (q) => q.eq("phone", phone)).unique();
    const value = { phone, encryptedProfile, updatedAt: Date.now() };
    if (existing) await ctx.db.replace(existing._id, value);
    else await ctx.db.insert("convenienceProfiles", value);
    return null;
  }
});
