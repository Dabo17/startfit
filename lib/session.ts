"use client";

import { useEffect, useState } from "react";

// Das Sitzungs-Token kommt vom Server nach Login/Registrierung und wird lokal gespeichert.
// Alle Convex-Funktionen bekommen es mit und prüfen serverseitig, wem die Daten gehören.
const KEY = "startfit_session";
const EVENT = "startfit-session";

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(KEY, token);
    // Alte Geräte-ID aus der Version ohne Login aufräumen
    localStorage.removeItem("startfit_device_id");
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.clear();
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/**
 * undefined = noch nicht geladen (erstes Rendern), null = nicht angemeldet, string = Token.
 */
export function useSessionToken(): string | null | undefined {
  const [token, setTok] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const update = () => setTok(getToken());
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return token;
}
