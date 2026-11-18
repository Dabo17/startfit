// Registrierung und Anmeldung per E-Mail + Passwort.
// Fehler werden als Rückgabewert gemeldet (Convex blendet geworfene Fehlertexte in Production aus).
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { pbkdf2, randomHex, safeEqual } from "./crypto";
import { SESSION_DAYS, ownerOrNull } from "./session";

const ITERATIONS = 8000;
const GENDERS = ["weiblich", "maennlich", "divers", "keine_angabe"];

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

async function createSession(ctx: any, userId: any) {
  const token = randomHex(32);
  const now = Date.now();
  await ctx.db.insert("sessions", { token, userId, createdAt: now, expiresAt: now + SESSION_DAYS * 864e5 });
  return token;
}

export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    age: v.number(),
    gender: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normEmail(args.email);
    const name = args.name.trim().slice(0, 40);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, field: "email", message: "Bitte gib eine gültige E-Mail-Adresse ein." };
    if (args.password.length < 8) return { ok: false, field: "password", message: "Das Passwort braucht mindestens 8 Zeichen." };
    if (name.length < 2) return { ok: false, field: "name", message: "Bitte gib deinen Namen ein." };
    if (!Number.isInteger(args.age) || args.age < 14 || args.age > 100)
      return { ok: false, field: "age", message: "StartFit ist für Personen ab 14 Jahren." };
    if (!GENDERS.includes(args.gender)) return { ok: false, field: "gender", message: "Bitte wähle eine Option." };

    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique();
    if (existing) return { ok: false, field: "email", message: "Für diese E-Mail gibt es schon ein Konto. Melde dich an." };

    const salt = randomHex(16);
    const userId = await ctx.db.insert("users", {
      email,
      passwordHash: pbkdf2(args.password, salt, ITERATIONS),
      salt,
      iterations: ITERATIONS,
      name,
      age: args.age,
      gender: args.gender,
      createdAt: Date.now(),
    });
    return { ok: true, token: await createSession(ctx, userId) };
  },
});

export const signIn = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", normEmail(email))).unique();
    const fail = { ok: false, message: "E-Mail oder Passwort stimmen nicht." };
    if (!user) return fail;
    const hash = pbkdf2(password, user.salt, user.iterations);
    if (!safeEqual(hash, user.passwordHash)) return fail;
    return { ok: true, token: await createSession(ctx, user._id) };
  },
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const s = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (s) await ctx.db.delete(s._id);
  },
});

export const me = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const owner = await ownerOrNull(ctx, token);
    if (!owner) return null;
    const user: any = await ctx.db.get(owner as any);
    if (!user) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_device", (q) => q.eq("deviceId", owner))
      .unique();
    return {
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      hasProfile: !!profile,
    };
  },
});

export const updateAccount = mutation({
  args: { token: v.string(), name: v.string(), age: v.number(), gender: v.string() },
  handler: async (ctx, { token, name, age, gender }) => {
    const owner = await ownerOrNull(ctx, token);
    if (!owner) return { ok: false, message: "Bitte melde dich erneut an." };
    if (name.trim().length < 2) return { ok: false, message: "Bitte gib deinen Namen ein." };
    if (!Number.isInteger(age) || age < 14 || age > 100) return { ok: false, message: "Alter zwischen 14 und 100." };
    if (!GENDERS.includes(gender)) return { ok: false, message: "Bitte wähle ein Geschlecht." };
    await ctx.db.patch(owner as any, { name: name.trim().slice(0, 40), age, gender });
    return { ok: true };
  },
});
