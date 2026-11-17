"use client";

import { useParams, useRouter } from "next/navigation";
import { EXERCISE_BY_ID } from "@/convex/exercises";

export default function ExercisePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ex = EXERCISE_BY_ID[params?.id ?? ""];

  if (!ex) {
    return (
      <main className="shell no-nav">
        <button className="back" onClick={() => router.back()}>← Zurück</button>
        <h1>Übung nicht gefunden</h1>
      </main>
    );
  }

  const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " richtige Ausführung")}`;

  return (
    <main className="shell no-nav">
      <div className="topbar">
        <button className="back" onClick={() => router.back()}>← Zurück</button>
      </div>
      <div className="eyebrow">{ex.muscles}</div>
      <h1>{ex.name}</h1>

      <div className="placeholder-media" role="img" aria-label="Platzhalter für Übungsbild">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M10 9.5v5l4-2.5-4-2.5z" fill="currentColor" />
        </svg>
        Bild / Video folgt (Prototyp)
      </div>

      <div className="card">
        <h2>So geht&apos;s</h2>
        <ol className="steps">
          {ex.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h2>Häufige Fehler</h2>
        <ul className="mistakes">
          {ex.mistakes.map((m, i) => (
            <li key={i}>✕ {m}</li>
          ))}
        </ul>
      </div>

      <div className="card flat">
        <h3 style={{ marginBottom: 6 }}>Warum diese Übung?</h3>
        <p className="small muted" style={{ margin: 0 }}>{ex.baseWhy}</p>
      </div>

      <a className="btn secondary" href={videoUrl} target="_blank" rel="noopener noreferrer">
        Video-Beispiele ansehen ↗
      </a>
      <p className="footer-note">Bei Schmerzen sofort abbrechen und ärztlich abklären.</p>
    </main>
  );
}
