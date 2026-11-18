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

export const avatarValidator = v.object({
  skin: v.number(),
  hair: v.number(),
  hairColor: v.number(),
  shirt: v.number(),
});

export default defineSchema({
  // Konten: E-Mail + Passwort (PBKDF2-Hash mit Salt). Name, Alter, Geschlecht für die Personalisierung.
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    salt: v.string(),
    iterations: v.number(),
    name: v.string(),
    age: v.number(),
    gender: v.string(), // "weiblich" | "maennlich" | "divers" | "keine_angabe"
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    token: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // Hinweis: Das Feld "deviceId" in den folgenden Tabellen enthält den Besitzer-Schlüssel
  // (= ID des angemeldeten Kontos). Der Name blieb aus Kompatibilitätsgründen erhalten.
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
    split: v.optional(v.string()), // "ganzkoerper" | "split2" | "split3" | "split4"
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

  // Buddy + öffentliches Profil. Andere sehen nur Spitzname, Buddy, Level und PLZ-Bereich –
  // nie die deviceId. Sichtbarkeit für "In der Nähe" ist Opt-in.
  social: defineTable({
    deviceId: v.string(),
    buddyName: v.string(),
    avatar: avatarValidator,
    nickname: v.optional(v.string()),
    plzArea: v.optional(v.string()), // nur die ersten 3 Ziffern
    discoverable: v.boolean(),
    friendCode: v.string(),
    demo: v.optional(v.boolean()),
    demoStats: v.optional(v.object({ totalXp: v.number(), weeklyXp: v.number(), weekStreak: v.number() })),
    demoLabel: v.optional(v.string()),
  })
    .index("by_device", ["deviceId"])
    .index("by_code", ["friendCode"])
    .index("by_discoverable", ["discoverable"]),

  friendships: defineTable({
    from: v.id("social"),
    to: v.id("social"),
    status: v.string(), // "pending" | "accepted"
    createdAt: v.number(),
  })
    .index("by_from", ["from"])
    .index("by_to", ["to"]),

  nudges: defineTable({
    from: v.id("social"),
    to: v.id("social"),
    createdAt: v.number(),
    seen: v.boolean(),
  }).index("by_to", ["to", "createdAt"]),
});
