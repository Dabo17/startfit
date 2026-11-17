// Buddy, Freunde in der Nähe, Rangliste und Anstupsen.
// Andere Nutzer werden nur über ihre öffentliche ID (social._id) angesprochen – nie über die deviceId.
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { avatarValidator } from "./schema";
import { computeStats, levelFromXp, levelTitle } from "./gamification";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function getMe(ctx: any, deviceId: string) {
  if (!deviceId) return null;
  return await ctx.db
    .query("social")
    .withIndex("by_device", (q: any) => q.eq("deviceId", deviceId))
    .unique();
}

async function newFriendCode(ctx: any): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    const exists = await ctx.db
      .query("social")
      .withIndex("by_code", (q: any) => q.eq("friendCode", code))
      .first();
    if (!exists) return code;
  }
  throw new Error("Kein Code frei");
}

async function statsFor(ctx: any, doc: any) {
  if (doc.demo && doc.demoStats) {
    const level = levelFromXp(doc.demoStats.totalXp);
    return {
      totalXp: doc.demoStats.totalXp,
      weeklyXp: doc.demoStats.weeklyXp,
      weekStreak: doc.demoStats.weekStreak,
      level,
      levelTitle: levelTitle(level),
      mood: doc.demoStats.weeklyXp > 150 ? "top" : "gut",
      energy: doc.demoStats.weeklyXp > 150 ? 90 : 60,
    };
  }
  const workouts = await ctx.db
    .query("workouts")
    .withIndex("by_device", (q: any) => q.eq("deviceId", doc.deviceId))
    .collect();
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_device", (q: any) => q.eq("deviceId", doc.deviceId))
    .unique();
  const s = computeStats(workouts, profile?.daysPerWeek ?? 3);
  return {
    totalXp: s.totalXp,
    weeklyXp: s.weeklyXp,
    weekStreak: s.weekStreak,
    level: s.level,
    levelTitle: s.levelTitle,
    mood: s.mood,
    energy: s.energy,
  };
}

async function trainingInfo(ctx: any, doc: any) {
  if (doc.demo) return doc.demoLabel ?? null;
  const p = await ctx.db
    .query("profiles")
    .withIndex("by_device", (q: any) => q.eq("deviceId", doc.deviceId))
    .unique();
  if (!p) return null;
  const where = p.location === "gym" ? "im Studio" : "zuhause";
  const when = { morgens: "morgens", mittags: "mittags", abends: "abends", wechselnd: "zu wechselnden Zeiten" }[
    p.trainingTime as string
  ];
  return `trainiert ${p.daysPerWeek}× pro Woche ${where}, meist ${when}`;
}

async function publicView(ctx: any, doc: any) {
  const stats = await statsFor(ctx, doc);
  return {
    id: doc._id,
    nickname: doc.nickname ?? doc.buddyName,
    buddyName: doc.buddyName,
    avatar: doc.avatar,
    region: doc.plzArea ? `PLZ ${doc.plzArea}xx` : null,
    info: await trainingInfo(ctx, doc),
    demo: !!doc.demo,
    ...stats,
  };
}

async function friendshipBetween(ctx: any, a: any, b: any) {
  const ab = await ctx.db
    .query("friendships")
    .withIndex("by_from", (q: any) => q.eq("from", a))
    .filter((q: any) => q.eq(q.field("to"), b))
    .first();
  if (ab) return ab;
  return await ctx.db
    .query("friendships")
    .withIndex("by_from", (q: any) => q.eq("from", b))
    .filter((q: any) => q.eq(q.field("to"), a))
    .first();
}

async function allFriendships(ctx: any, meId: any) {
  const out = await ctx.db.query("friendships").withIndex("by_from", (q: any) => q.eq("from", meId)).collect();
  const inc = await ctx.db.query("friendships").withIndex("by_to", (q: any) => q.eq("to", meId)).collect();
  return { out, inc };
}

// ---------------- Queries ----------------

export const me = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const doc = await getMe(ctx, deviceId);
    if (!doc) return null;
    const nudges = await ctx.db
      .query("nudges")
      .withIndex("by_to", (q: any) => q.eq("to", doc._id))
      .order("desc")
      .take(10);
    const unseen = [];
    for (const n of nudges) {
      if (n.seen) continue;
      const from = await ctx.db.get(n.from);
      unseen.push({ id: n._id, from: from?.nickname ?? from?.buddyName ?? "Jemand", createdAt: n.createdAt });
    }
    return {
      id: doc._id,
      buddyName: doc.buddyName,
      avatar: doc.avatar,
      nickname: doc.nickname ?? null,
      plzArea: doc.plzArea ?? null,
      discoverable: doc.discoverable,
      friendCode: doc.friendCode,
      nudges: unseen,
    };
  },
});

export const nearby = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const meDoc = await getMe(ctx, deviceId);
    if (!meDoc || !meDoc.discoverable || !meDoc.plzArea || !meDoc.nickname) return { ready: false, people: [] };
    const { out, inc } = await allFriendships(ctx, meDoc._id);
    const related = new Map<string, string>();
    for (const f of out) related.set(f.to, f.status === "accepted" ? "friend" : "sent");
    for (const f of inc) related.set(f.from, f.status === "accepted" ? "friend" : "received");

    const candidates = await ctx.db
      .query("social")
      .withIndex("by_discoverable", (q: any) => q.eq("discoverable", true))
      .take(300);
    const region = meDoc.plzArea.slice(0, 2);
    const people = [];
    for (const c of candidates) {
      if (c._id === meDoc._id) continue;
      if (related.get(c._id) === "friend") continue;
      const sameRegion = c.plzArea && c.plzArea.slice(0, 2) === region;
      if (!sameRegion && !c.demo) continue;
      people.push({ ...(await publicView(ctx, c)), relation: related.get(c._id) ?? null, sameArea: c.plzArea === meDoc.plzArea });
      if (people.length >= 20) break;
    }
    // Echte Nutzer zuerst, dann gleicher PLZ-Bereich
    people.sort((a: any, b: any) => Number(a.demo) - Number(b.demo) || Number(b.sameArea) - Number(a.sameArea));
    return { ready: true, people };
  },
});

export const friends = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const meDoc = await getMe(ctx, deviceId);
    if (!meDoc) return null;
    const { out, inc } = await allFriendships(ctx, meDoc._id);
    const board = [{ ...(await publicView(ctx, meDoc)), isMe: true, friendshipId: null }];
    const incoming = [];
    const outgoing = [];
    for (const f of out) {
      const other = await ctx.db.get(f.to);
      if (!other) continue;
      if (f.status === "accepted") board.push({ ...(await publicView(ctx, other)), isMe: false, friendshipId: f._id });
      else outgoing.push({ requestId: f._id, ...(await publicView(ctx, other)) });
    }
    for (const f of inc) {
      const other = await ctx.db.get(f.from);
      if (!other) continue;
      if (f.status === "accepted") board.push({ ...(await publicView(ctx, other)), isMe: false, friendshipId: f._id });
      else incoming.push({ requestId: f._id, ...(await publicView(ctx, other)) });
    }
    board.sort((a: any, b: any) => b.weeklyXp - a.weeklyXp || b.totalXp - a.totalXp);
    return { board, incoming, outgoing };
  },
});

// ---------------- Mutations ----------------

export const saveBuddy = mutation({
  args: { deviceId: v.string(), buddyName: v.string(), avatar: avatarValidator },
  handler: async (ctx, { deviceId, buddyName, avatar }) => {
    if (deviceId.length < 16) throw new Error("Ungültige Geräte-ID");
    const name = buddyName.trim().slice(0, 20) || "Buddy";
    const existing = await getMe(ctx, deviceId);
    if (existing) {
      await ctx.db.patch(existing._id, { buddyName: name, avatar });
      return existing._id;
    }
    return await ctx.db.insert("social", {
      deviceId,
      buddyName: name,
      avatar,
      discoverable: false,
      friendCode: await newFriendCode(ctx),
    });
  },
});

export const saveSocial = mutation({
  args: { deviceId: v.string(), nickname: v.string(), plz: v.string(), discoverable: v.boolean() },
  handler: async (ctx, { deviceId, nickname, plz, discoverable }) => {
    const meDoc = await getMe(ctx, deviceId);
    if (!meDoc) throw new Error("Bitte erst deinen Buddy erstellen.");
    const nick = nickname.trim().slice(0, 20);
    if (nick.length < 2) throw new Error("Bitte wähle einen Spitznamen (mind. 2 Zeichen).");
    const digits = plz.replace(/\D/g, "");
    if (digits.length !== 5) throw new Error("Bitte gib eine 5-stellige Postleitzahl ein.");
    await ctx.db.patch(meDoc._id, { nickname: nick, plzArea: digits.slice(0, 3), discoverable });
  },
});

const DEMO_PROFILES = [
  { deviceId: "demo-lena", nickname: "Lena", buddyName: "Fritzi", avatar: { skin: 1, hair: 1, hairColor: 2, shirt: 3 }, plzArea: "353", totalXp: 1180, weeklyXp: 240, weekStreak: 4, label: "trainiert 3× pro Woche im Studio, meist abends" },
  { deviceId: "demo-murat", nickname: "Murat", buddyName: "Bolt", avatar: { skin: 3, hair: 0, hairColor: 0, shirt: 1 }, plzArea: "353", totalXp: 620, weeklyXp: 165, weekStreak: 2, label: "trainiert 4× pro Woche im Studio, meist morgens" },
  { deviceId: "demo-sabine", nickname: "Sabine", buddyName: "Hanni", avatar: { skin: 0, hair: 2, hairColor: 3, shirt: 4 }, plzArea: "354", totalXp: 300, weeklyXp: 95, weekStreak: 1, label: "trainiert 2× pro Woche zuhause, meist mittags" },
  { deviceId: "demo-jonas", nickname: "Jonas", buddyName: "Turbo", avatar: { skin: 2, hair: 3, hairColor: 1, shirt: 0 }, plzArea: "353", totalXp: 140, weeklyXp: 60, weekStreak: 0, label: "trainiert 3× pro Woche zuhause, meist abends" },
];

/** Legt einmalig klar gekennzeichnete Demo-Profile an, damit "In der Nähe" im Prototyp nicht leer ist. */
export const ensureDemo = mutation({
  args: {},
  handler: async (ctx) => {
    for (const d of DEMO_PROFILES) {
      const exists = await getMe(ctx, d.deviceId);
      if (exists) continue;
      await ctx.db.insert("social", {
        deviceId: d.deviceId,
        nickname: d.nickname,
        buddyName: d.buddyName,
        avatar: d.avatar,
        plzArea: d.plzArea,
        discoverable: true,
        friendCode: await newFriendCode(ctx),
        demo: true,
        demoLabel: d.label,
        demoStats: { totalXp: d.totalXp, weeklyXp: d.weeklyXp, weekStreak: d.weekStreak },
      });
    }
  },
});

async function connect(ctx: any, meDoc: any, target: any) {
  if (!target) return { ok: false, message: "Person nicht gefunden." };
  if (target._id === meDoc._id) return { ok: false, message: "Das ist dein eigener Code 😉" };
  const existing = await friendshipBetween(ctx, meDoc._id, target._id);
  if (existing) {
    if (existing.status === "accepted") return { ok: false, message: "Ihr seid schon befreundet." };
    if (existing.to === meDoc._id) {
      await ctx.db.patch(existing._id, { status: "accepted" });
      return { ok: true, message: "Anfrage angenommen – ihr seid jetzt Freunde!" };
    }
    return { ok: false, message: "Anfrage ist schon unterwegs." };
  }
  const status = target.demo ? "accepted" : "pending";
  await ctx.db.insert("friendships", { from: meDoc._id, to: target._id, status, createdAt: Date.now() });
  if (target.demo) {
    // Demo-Freund stupst direkt zurück, damit man die Funktion sieht
    await ctx.db.insert("nudges", { from: target._id, to: meDoc._id, createdAt: Date.now(), seen: false });
    return { ok: true, message: `Du und ${target.nickname} seid jetzt Freunde!` };
  }
  return { ok: true, message: "Anfrage gesendet." };
}

export const requestFriend = mutation({
  args: { deviceId: v.string(), targetId: v.id("social") },
  handler: async (ctx, { deviceId, targetId }) => {
    const meDoc = await getMe(ctx, deviceId);
    if (!meDoc?.nickname) return { ok: false, message: "Lege zuerst deinen Spitznamen fest." };
    return await connect(ctx, meDoc, await ctx.db.get(targetId));
  },
});

export const addByCode = mutation({
  args: { deviceId: v.string(), code: v.string() },
  handler: async (ctx, { deviceId, code }) => {
    const meDoc = await getMe(ctx, deviceId);
    if (!meDoc?.nickname) return { ok: false, message: "Lege zuerst deinen Spitznamen fest." };
    const clean = code.trim().toUpperCase();
    const target = await ctx.db
      .query("social")
      .withIndex("by_code", (q: any) => q.eq("friendCode", clean))
      .first();
    if (!target) return { ok: false, message: "Diesen Code gibt es nicht. Bitte prüfe die Schreibweise." };
    return await connect(ctx, meDoc, target);
  },
});

export const respond = mutation({
  args: { deviceId: v.string(), requestId: v.id("friendships"), accept: v.boolean() },
  handler: async (ctx, { deviceId, requestId, accept }) => {
    const meDoc = await getMe(ctx, deviceId);
    const f = await ctx.db.get(requestId);
    if (!meDoc || !f) return;
    const involved = f.to === meDoc._id || f.from === meDoc._id;
    if (!involved) return;
    if (accept && f.to === meDoc._id) await ctx.db.patch(requestId, { status: "accepted" });
    else await ctx.db.delete(requestId);
  },
});

export const nudge = mutation({
  args: { deviceId: v.string(), targetId: v.id("social") },
  handler: async (ctx, { deviceId, targetId }) => {
    const meDoc = await getMe(ctx, deviceId);
    if (!meDoc) return { ok: false, message: "Kein Profil." };
    const f = await friendshipBetween(ctx, meDoc._id, targetId);
    if (!f || f.status !== "accepted") return { ok: false, message: "Ihr seid noch keine Freunde." };
    const recent = await ctx.db
      .query("nudges")
      .withIndex("by_to", (q: any) => q.eq("to", targetId).gte("createdAt", Date.now() - 12 * 3600e3))
      .filter((q: any) => q.eq(q.field("from"), meDoc._id))
      .first();
    if (recent) return { ok: false, message: "Du hast heute schon angestupst – morgen wieder!" };
    await ctx.db.insert("nudges", { from: meDoc._id, to: targetId, createdAt: Date.now(), seen: false });
    return { ok: true, message: "Angestupst! 💪" };
  },
});

export const markNudgesSeen = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const meDoc = await getMe(ctx, deviceId);
    if (!meDoc) return;
    const list = await ctx.db
      .query("nudges")
      .withIndex("by_to", (q: any) => q.eq("to", meDoc._id))
      .collect();
    for (const n of list) if (!n.seen) await ctx.db.patch(n._id, { seen: true });
  },
});
