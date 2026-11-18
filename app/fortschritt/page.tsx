"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EXERCISE_BY_ID } from "@/convex/exercises";
import BottomNav from "@/components/BottomNav";
import { useSessionToken } from "@/lib/session";

type Point = { t: number; v: number };

function Sparkline({ points, unit }: { points: Point[]; unit: string }) {
  const W = 300, H = 110, P = 14;
  const vs = points.map((p) => p.v);
  const min = Math.min(...vs), max = Math.max(...vs);
  const span = max - min || 1;
  const x = (i: number) => (points.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (points.length - 1));
  const y = (v: number) => (max === min ? H / 2 : H - P - ((v - min) / span) * (H - 2 * P));
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const fmt = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Verlauf von ${fmt(points[0].v)} auf ${fmt(points[points.length - 1].v)} ${unit}`}>
      <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="var(--line)" />
      {points.length > 1 && <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.v)} r={i === points.length - 1 ? 5 : 3.5} fill={i === points.length - 1 ? "var(--accent)" : "#fff"} stroke="var(--accent)" strokeWidth="2" />
      ))}
      <text x={x(points.length - 1)} y={Math.max(12, y(points[points.length - 1].v) - 10)} textAnchor={points.length === 1 ? "middle" : "end"} fontSize="12" fontWeight="700" fill="var(--ink)">
        {fmt(points[points.length - 1].v)} {unit}
      </text>
    </svg>
  );
}

export default function ProgressPage() {
  const token = useSessionToken();
  const workouts = useQuery(api.workouts.list, token ? { token } : "skip");

  if (!workouts) {
    return (
      <main className="shell">
        <div className="center-screen"><div className="spinner" aria-hidden /></div>
        <BottomNav />
      </main>
    );
  }

  if (workouts.length === 0) {
    return (
      <main className="shell">
        <div className="eyebrow">Fortschritt</div>
        <div className="center-screen" style={{ minHeight: "60dvh" }}>
          <div style={{ fontSize: 44 }} aria-hidden>📈</div>
          <h1>Starte dein erstes Training</h1>
          <p className="muted">Nach deinem ersten Training siehst du hier deine Einheiten und wie sich deine Gewichte entwickeln.</p>
          <Link href="/plan" className="btn" style={{ marginTop: 8 }}>Zum Plan</Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = workouts.filter((w: any) => w.completedAt >= weekAgo).length;
  const totalSets = workouts.reduce(
    (n: number, w: any) => n + w.entries.reduce((m: number, e: any) => m + e.sets.filter((s: any) => s.done).length, 0),
    0,
  );

  // Verlauf pro Übung: Gewicht (Kraftübungen mit Gewicht) oder beste Wiederholungen
  const series = new Map<string, { points: Point[]; unit: string }>();
  for (const w of workouts as any[]) {
    for (const e of w.entries) {
      const ex = EXERCISE_BY_ID[e.exerciseId];
      if (!ex || ex.category === "mobilitaet") continue;
      const done = e.sets.filter((s: any) => s.done);
      if (!done.length) continue;
      const maxW = Math.max(0, ...done.map((s: any) => s.weight ?? 0));
      const useWeight = ex.usesWeight && maxW > 0;
      const v = useWeight ? maxW : Math.max(0, ...done.map((s: any) => s.reps ?? 0));
      if (v <= 0) continue;
      const unit = useWeight ? "kg" : ex.unit === "sek" ? "Sek." : "Wdh.";
      const cur = series.get(e.exerciseId) ?? { points: [], unit };
      cur.points.push({ t: w.completedAt, v });
      cur.unit = unit;
      series.set(e.exerciseId, cur);
    }
  }
  const sorted = [...series.entries()].sort((a, b) => b[1].points.length - a[1].points.length);
  const recent = [...workouts].reverse().slice(0, 5);

  return (
    <main className="shell">
      <div className="eyebrow">Fortschritt</div>
      <h1>{workouts.length === 1 ? "Dein erstes Training ist geschafft!" : `${workouts.length} Trainings – stark!`}</h1>
      <p className="muted">Jede Einheit zählt. Hier siehst du, wie du dich entwickelst.</p>

      <div className="stats">
        <div className="stat"><div className="val">{workouts.length}</div><div className="lbl">Einheiten gesamt</div></div>
        <div className="stat"><div className="val">{thisWeek}</div><div className="lbl">diese Woche</div></div>
        <div className="stat"><div className="val">{totalSets}</div><div className="lbl">Sätze geschafft</div></div>
      </div>

      <h2 style={{ marginTop: 20 }}>Verlauf pro Übung</h2>
      {sorted.map(([id, s]) => {
        const ex = EXERCISE_BY_ID[id];
        const first = s.points[0].v;
        const last = s.points[s.points.length - 1].v;
        const diff = last - first;
        return (
          <div key={id} className="card">
            <div className="row between">
              <strong>{ex.name}</strong>
              {s.points.length > 1 && diff !== 0 && (
                <span className={`badge ${diff > 0 ? "" : "neutral"}`}>
                  {diff > 0 ? "+" : ""}
                  {diff.toLocaleString("de-DE", { maximumFractionDigits: 1 })} {s.unit}
                </span>
              )}
            </div>
            <Sparkline points={s.points} unit={s.unit} />
            {s.points.length === 1 && (
              <p className="tiny" style={{ margin: 0 }}>Nach dem nächsten Training siehst du hier deine Entwicklung.</p>
            )}
          </div>
        );
      })}

      <h2 style={{ marginTop: 20 }}>Letzte Trainings</h2>
      <div className="card">
        {recent.map((w: any) => (
          <div key={w._id} className="ex-row">
            <div className="row between">
              <span className="ex-name">{w.dayTitle.split(" · ")[1] ?? w.dayTitle}</span>
              <span className="tiny">
                {new Date(w.completedAt).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}
              </span>
            </div>
            <div className="ex-meta">
              {w.entries.reduce((m: number, e: any) => m + e.sets.filter((s: any) => s.done).length, 0)} Sätze
              {w.feedback && ` · ${w.feedback === "zu_leicht" ? "zu leicht" : w.feedback === "zu_schwer" ? "zu schwer" : "passte"}`}
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
