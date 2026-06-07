import { internalMutation, mutation } from "./_generated/server";
import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";

const markReadyReference = makeFunctionReference<
  "mutation",
  { submissionId: string; phone: string; text: string; runAt: number },
  null
>("reminders:markReady");

export const schedule = mutation({
  args: { submissionId: v.string(), phone: v.string(), text: v.string(), runAt: v.number() },
  returns: v.id("reminderJobs"),
  handler: async (ctx, args) => {
    const scheduledFunctionId = await ctx.scheduler.runAt(args.runAt, markReadyReference, args);
    return ctx.db.insert("reminderJobs", {
      submissionId: args.submissionId,
      scheduledFunctionId,
      runAt: args.runAt,
      status: "scheduled"
    });
  }
});

export const markReady = internalMutation({
  args: { submissionId: v.string(), phone: v.string(), text: v.string(), runAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("sessionEvents", {
      phone: args.phone,
      kind: "reminder_ready",
      payload: { text: args.text, submissionId: args.submissionId },
      createdAt: Date.now()
    });
    const job = await ctx.db.query("reminderJobs")
      .withIndex("by_submission_and_run_at", (q) => q.eq("submissionId", args.submissionId).eq("runAt", args.runAt))
      .unique();
    if (job) await ctx.db.patch(job._id, { status: "ready" });
    return null;
  }
});
