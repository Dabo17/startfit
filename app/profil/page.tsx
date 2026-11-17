"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { LABELS } from "@/convex/planLogic";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import { resetDeviceId, useDeviceId } from "@/lib/device";

export default function ProfilePage() {
  const deviceId = useDeviceId();
  const router = useRouter();
  const profile = useQuery(api.profiles.get, deviceId ? { deviceId } : "skip");
  const deleteAll = useMutation(api.account.deleteAll);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);

  if (editing && profile) {
    return (
      <main className="shell no-nav">
        <Onboarding
          mode="edit"
          initial={profile}
          onDone={() => {
            setEditing(false);
            setSaved(true);
          }}
        />
      </main>
    );
  }

  async function doDelete() {
    if (!deviceId) return;
    setDeleting(true);
    try {
      await deleteAll({ deviceId });
      resetDeviceId();
      try { sessionStorage.clear(); } catch {}
      router.replace("/");
      setTimeout(() => window.location.reload(), 50);
    } finally {
      setDeleting(false);
    }
  }

  const rows: [string, string][] = profile
    ? [
        ["Ziel", (LABELS.goal as any)[profile.goal]],
        ["Erfahrung", (LABELS.experience as any)[profile.experience]],
        ["Zeit", `${profile.daysPerWeek}× pro Woche · ${profile.minutes} Min.`],
        ["Trainingsort", (LABELS.location as any)[profile.location]],
        ["Arbeit", (LABELS.work as any)[profile.work]],
        ["Trainingszeit", (LABELS.trainingTime as any)[profile.trainingTime]],
      ]
    : [];

  return (
    <main className="shell">
      <div className="eyebrow">Profil</div>
      <h1>Deine Angaben</h1>
      <p className="muted">Hat sich etwas geändert? Passe deine Antworten an – dein Plan wird neu erstellt, dein Verlauf bleibt.</p>

      {saved && <div className="banner info">Gespeichert – dein Plan wurde neu erstellt.</div>}

      {profile === undefined && <div className="spinner" aria-hidden />}
      {profile === null && <p className="muted">Noch kein Profil angelegt.</p>}
      {profile && (
        <div className="card">
          {rows.map(([k, v]) => (
            <div key={k} className="ex-row row between">
              <span className="muted small">{k}</span>
              <strong style={{ textAlign: "right" }}>{v}</strong>
            </div>
          ))}
        </div>
      )}
      {profile && (
        <button className="btn secondary" onClick={() => { setSaved(false); setEditing(true); }}>
          Angaben ändern
        </button>
      )}

      <a href="/mythen" className="card flat row between" style={{ display: "flex", marginTop: 16 }}>
        <div>
          <strong>🔎 Mythen-Check</strong>
          <div className="small muted">Fitness-Tipps aus dem Netz prüfen</div>
        </div>
        <span className="link">→</span>
      </a>

      <div className="card flat" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 6 }}>Datenschutz</h3>
        <p className="small muted">
          StartFit speichert nur deine Trainingsangaben, deinen Plan, deinen Verlauf und deinen Buddy – ohne echten
          Namen, E-Mail oder Gesundheitsdaten. Für Freunde sichtbar sind nur Spitzname, Buddy, Level und PLZ-Bereich
          (erste 3 Ziffern), und nur wenn du das unter „Freunde“ einschaltest.
        </p>
        {!confirmDelete ? (
          <button className="btn danger" onClick={() => setConfirmDelete(true)}>Alle meine Daten löschen</button>
        ) : (
          <div className="stack">
            <p className="small" style={{ margin: 0 }}><strong>Wirklich löschen?</strong> Profil, Plan, alle Trainings, dein Buddy und deine Freundschaften werden dauerhaft entfernt.</p>
            <button className="btn danger" onClick={doDelete} disabled={deleting}>
              {deleting ? "Wird gelöscht …" : "Ja, endgültig löschen"}
            </button>
            <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Abbrechen</button>
          </div>
        )}
      </div>
      <p className="footer-note">StartFit Prototyp · Inhalte KI-generiert · Keine Heilversprechen</p>
      <BottomNav />
    </main>
  );
}
