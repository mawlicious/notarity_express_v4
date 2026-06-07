import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    phone: v.string(),
    successfulSubmissions: v.number(),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_phone", ["phone"]),
  styleProfiles: defineTable({
    phone: v.string(),
    profile: v.any(),
    updatedAt: v.number()
  }).index("by_phone", ["phone"]),
  convenienceProfiles: defineTable({
    phone: v.string(),
    encryptedProfile: v.string(),
    updatedAt: v.number()
  }).index("by_phone", ["phone"]),
  sessions: defineTable({
    phone: v.string(),
    state: v.any(),
    expiresAt: v.number(),
    updatedAt: v.number()
  }).index("by_phone", ["phone"]),
  sessionEvents: defineTable({
    phone: v.string(),
    kind: v.string(),
    payload: v.any(),
    createdAt: v.number()
  }).index("by_phone_and_created_at", ["phone", "createdAt"]),
  media: defineTable({
    externalId: v.string(),
    phone: v.string(),
    path: v.string(),
    mimeType: v.string(),
    expiresAt: v.number(),
    createdAt: v.number()
  })
    .index("by_external_id", ["externalId"])
    .index("by_expires_at", ["expiresAt"]),
  processedMessages: defineTable({
    messageId: v.string(),
    phone: v.string(),
    processedAt: v.number()
  }).index("by_message_id", ["messageId"]),
  submissions: defineTable({
    externalId: v.string(),
    phone: v.string(),
    slotAt: v.optional(v.number()),
    payload: v.any(),
    response: v.any(),
    cancelledAt: v.optional(v.number()),
    createdAt: v.number()
  })
    .index("by_external_id", ["externalId"])
    .index("by_phone", ["phone"]),
  reminderJobs: defineTable({
    submissionId: v.string(),
    scheduledFunctionId: v.optional(v.id("_scheduled_functions")),
    runAt: v.number(),
    status: v.union(v.literal("scheduled"), v.literal("ready"), v.literal("cancelled"))
  }).index("by_submission_and_run_at", ["submissionId", "runAt"])
});
