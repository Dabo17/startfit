import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { ownerOrNull, requireOwner } from "./session";

export const profileFields = {
  goal: v.string(),
  experience: v.string(),
  daysPerWeek: v.number(),
  minutes: v.number(),
  location: v.string(),
  work: v.string(),
  trainingTime: v.string(),
  split: v.string(),
};

export const get = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const owner = await ownerOrNull(ctx, token);
    if (!owner) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_device", (q) => q.eq("deviceId", owner))
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

/** Für Actions: Token → Besitzer-Schlüssel. */
export const ownerInternal = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => await ownerOrNull(ctx, token),
});

export const save = mutation({
  args: { token: v.string(), ...profileFields },
  handler: async (ctx, { token, ...fields }) => {
    const deviceId = await requireOwner(ctx, token);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...fields, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("profiles", { deviceId, ...fields, consentAt: now, updatedAt: now });
  },
});

export const accountInternal = internalQuery({
  args: { owner: v.string() },
  handler: async (ctx, { owner }) => {
    const user: any = await ctx.db.get(owner as any);
    return user ? { age: user.age as number, gender: user.gender as string } : null;
  },
});
