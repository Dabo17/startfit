import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

export const profileFields = {
  goal: v.string(),
  experience: v.string(),
  daysPerWeek: v.number(),
  minutes: v.number(),
  location: v.string(),
  work: v.string(),
  trainingTime: v.string(),
};

export const get = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    if (!deviceId) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
      .unique();
  },
});

export const getInternal = internalQuery({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
      .unique();
  },
});

export const save = mutation({
  args: { deviceId: v.string(), ...profileFields },
  handler: async (ctx, args) => {
    if (args.deviceId.length < 16) throw new Error("Ungültige Geräte-ID");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("profiles", { ...args, consentAt: now, updatedAt: now });
  },
});
