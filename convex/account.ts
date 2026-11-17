import { v } from "convex/values";
import { mutation } from "./_generated/server";

/** DSGVO: Löschen auf Knopfdruck – entfernt Profil, Pläne, Trainingsverlauf, Buddy, Freundschaften. */
export const deleteAll = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
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
    return count;
  },
});
