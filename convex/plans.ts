import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { planDay } from "./schema";

export const current = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    if (!deviceId) return null;
    return await ctx.db
      .query("plans")
      .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
      .order("desc")
      .first();
  },
});

export const savePlan = internalMutation({
  args: {
    deviceId: v.string(),
    source: v.string(),
    summary: v.string(),
    notes: v.array(v.string()),
    days: v.array(planDay),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("plans", { ...args, createdAt: Date.now() });
  },
});
