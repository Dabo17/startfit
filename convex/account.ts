import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ownerOrNull } from "./session";

/** DSGVO: Löschen auf Knopfdruck – entfernt Konto, Profil, Pläne, Trainingsverlauf, Buddy, Freundschaften. */
export const deleteAll = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const deviceId = await ownerOrNull(ctx, token);
    if (!deviceId) return 0;
    let count = 0;

    const social = await ctx.db
      .query("social")
      .withIndex("by_device", (q: any) => q.eq("deviceId", deviceId))
      .unique();
    if (social) {
      const out = await ctx.db.query("friendships").withIndex("by_from", (q: any) => q.eq("from", social._id)).collect();
      const inc = await ctx.db.query("friendships").withIndex("by_to", (q: any) => q.eq("to", social._id)).collect();
      const nudgesIn = await ctx.db.query("nudges").withIndex("by_to", (q: any) => q.eq("to", social._id)).collect();
      const nudgesOut = (await ctx.db.query("nudges").collect()).filter((n: any) => n.from === social._id);
      for (const d of [...out, ...inc, ...nudgesIn, ...nudgesOut]) {
        await ctx.db.delete(d._id);
        count++;
      }
      await ctx.db.delete(social._id);
      count++;
    }

    const tables = ["profiles", "plans", "workouts"] as const;
    for (const table of tables) {
      const docs = await ctx.db
        .query(table)
        .withIndex("by_device", (q: any) => q.eq("deviceId", deviceId))
        .collect();
      for (const d of docs) {
        await ctx.db.delete(d._id);
        count++;
      }
    }
    // Konto und alle Sitzungen löschen
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q: any) => q.eq("userId", deviceId))
      .collect();
    for (const sdoc of sessions) await ctx.db.delete(sdoc._id);
    const user = await ctx.db.get(deviceId as any);
    if (user) await ctx.db.delete(user._id);
    return count + sessions.length + 1;
  },
});
