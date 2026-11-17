import { v } from "convex/values";
import { mutation } from "./_generated/server";

/** DSGVO: Löschen auf Knopfdruck – entfernt Profil, Pläne und Trainingsverlauf. */
export const deleteAll = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const tables = ["profiles", "plans", "workouts"] as const;
    let count = 0;
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
