import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const planDay = v.object({
  title: v.string(),
  focus: v.string(),
  estMinutes: v.number(),
  exercises: v.array(
    v.object({
      exerciseId: v.string(),
      sets: v.number(),
      reps: v.string(),
      why: v.string(),
    }),
  ),
});

export default defineSchema({
  // Kein Name, keine E-Mail, keine Gesundheitsdaten (DSGVO Art. 9) – nur Trainingspräferenzen.
  profiles: defineTable({
    deviceId: v.string(),
    goal: v.string(),
    experience: v.string(),
    daysPerWeek: v.number(),
    minutes: v.number(),
    location: v.string(),
    work: v.string(),
    trainingTime: v.string(),
    consentAt: v.number(),
    updatedAt: v.number(),
  }).index("by_device", ["deviceId"]),

  plans: defineTable({
    deviceId: v.string(),
    createdAt: v.number(),
    source: v.string(), // "ai" | "standard"
    summary: v.string(),
    notes: v.array(v.string()),
    days: v.array(planDay),
  }).index("by_device", ["deviceId", "createdAt"]),

  workouts: defineTable({
    deviceId: v.string(),
    planId: v.id("plans"),
    dayIndex: v.number(),
    dayTitle: v.string(),
    completedAt: v.number(),
    entries: v.array(
      v.object({
        exerciseId: v.string(),
        sets: v.array(
          v.object({
            reps: v.number(),
            weight: v.optional(v.number()),
            done: v.boolean(),
          }),
        ),
      }),
    ),
    feedback: v.optional(v.string()), // "zu_leicht" | "passt" | "zu_schwer"
  }).index("by_device", ["deviceId", "completedAt"]),
});
