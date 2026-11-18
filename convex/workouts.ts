import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ownerOrNull, requireOwner } from "./session";

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await ownerOrNull(ctx, token);
    if (!deviceId) return [];
    return await ctx.db
      .query("workouts")
      .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
      .order("asc")
      .collect();
  },
});

export const save = mutation({
  args: {
    token: v.string(),
    planId: v.id("plans"),
    dayIndex: v.number(),
    dayTitle: v.string(),
    entries: v.array(
      v.object({
        exerciseId: v.string(),
        sets: v.array(
          v.object({ reps: v.number(), weight: v.optional(v.number()), done: v.boolean() }),
        ),
      }),
    ),
  },
  handler: async (ctx, { token, ...args }) => {
    const deviceId = await requireOwner(ctx, token);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.deviceId !== deviceId) throw new Error("Plan nicht gefunden");
    return await ctx.db.insert("workouts", { ...args, deviceId, completedAt: Date.now() });
  },
});

export const setFeedback = mutation({
  args: {
    token: v.string(),
    workoutId: v.id("workouts"),
    feedback: v.union(v.literal("zu_leicht"), v.literal("passt"), v.literal("zu_schwer")),
  },
  handler: async (ctx, { token, workoutId, feedback }) => {
    const deviceId = await requireOwner(ctx, token);
    const w = await ctx.db.get(workoutId);
    if (!w || w.deviceId !== deviceId) throw new Error("Training nicht gefunden");
    await ctx.db.patch(workoutId, { feedback });
  },
});
