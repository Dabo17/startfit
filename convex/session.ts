// Ordnet ein Sitzungs-Token dem angemeldeten Konto zu.
// Alle Datenfunktionen bekommen das Token vom Browser und arbeiten nur mit den Daten dieses Kontos.

export const SESSION_DAYS = 30;

/** Liefert den Besitzer-Schlüssel (User-ID als String) oder null, wenn nicht angemeldet. */
export async function ownerOrNull(ctx: any, token: string | undefined | null): Promise<string | null> {
  if (!token || token.length < 20) return null;
  const s = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .unique();
  if (!s || s.expiresAt < Date.now()) return null;
  return s.userId as string;
}

/** Wie ownerOrNull, wirft aber, wenn niemand angemeldet ist (für Mutations). */
export async function requireOwner(ctx: any, token: string): Promise<string> {
  const owner = await ownerOrNull(ctx, token);
  if (!owner) throw new Error("NICHT_ANGEMELDET");
  return owner;
}
