"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { clearToken, useSessionToken } from "@/lib/session";

const PUBLIC = ["/", "/login"];

function Spinner() {
  return (
    <main className="shell no-nav">
      <div className="center-screen"><div className="spinner" aria-hidden /></div>
    </main>
  );
}

/**
 * Schützt alle Seiten außer Startseite und Login:
 * nicht angemeldet → /login, angemeldet ohne Trainingsprofil → /onboarding.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/";
  const router = useRouter();
  const token = useSessionToken();
  const me = useQuery(api.auth.me, token ? { token } : "skip");
  const isPublic = PUBLIC.includes(path);

  useEffect(() => {
    if (token === undefined) return;
    if (!token) {
      if (!isPublic) router.replace("/login");
      return;
    }
    if (me === undefined) return;
    if (me === null) {
      clearToken(); // abgelaufene oder gelöschte Sitzung
      if (!isPublic) router.replace("/login");
      return;
    }
    if (isPublic) {
      router.replace(me.hasProfile ? "/plan" : "/onboarding");
      return;
    }
    if (!me.hasProfile && path !== "/onboarding") router.replace("/onboarding");
  }, [token, me, isPublic, path, router]);

  if (isPublic) {
    // Angemeldete Nutzer werden weitergeleitet – solange nichts anzeigen
    if (token && me !== null) return <Spinner />;
    return <>{children}</>;
  }
  if (!token || !me) return <Spinner />;
  if (!me.hasProfile && path !== "/onboarding") return <Spinner />;
  return <>{children}</>;
}
