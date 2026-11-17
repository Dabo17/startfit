"use client";

import { useEffect, useState } from "react";

// Ohne Login funktioniert die App auf einem Gerät: Eine zufällige Geräte-ID
// (kein Name, keine E-Mail) verknüpft Profil, Plan und Verlauf.
const KEY = "startfit_device_id";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join("");
}

export function getOrCreateDeviceId(): string {
  let id = "";
  try {
    id = localStorage.getItem(KEY) ?? "";
    if (!id) {
      id = randomId();
      localStorage.setItem(KEY, id);
    }
  } catch {
    id = randomId();
  }
  return id;
}

export function resetDeviceId() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/** Liefert die Geräte-ID nach dem ersten Rendern im Browser (sonst null). */
export function useDeviceId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(getOrCreateDeviceId());
  }, []);
  return id;
}
