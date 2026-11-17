"use client";

import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EXERCISE_BY_ID } from "@/convex/exercises";
import BottomNav from "@/components/BottomNav";
import BuddyAvatar from "@/components/BuddyAvatar";
import { computeStats, moodText } from "@/convex/gamification";
import { useDeviceId } from "@/lib/device";

export default function PlanPage() {
  const deviceId = useDeviceId();
  const router = useRouter();
  const plan = useQuery(api.plans.current, deviceId ? { deviceId } : "skip");
  const workouts = useQuery(api.workouts.list, deviceId ? { deviceId } : "skip");
  const generatePlan = useAction(api.ai.generatePlan);
  const buddy = useQuery(api.social.me, deviceId ? { deviceId } : "skip");
  const profile = useQuery(api.profiles.get, deviceId ? { deviceId } : "skip");

  const [active, setActive] = useState<number | null>(null);
  const [openWhy, setOpenWhy] = useState<Record<string, boolean>>({});
  const [aiError, setAiError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    try {
      setAiError(sessionStorage.getItem("startfit_ai_error"));
    } catch {}
  }, []);

  useEffect(() => {
    if (plan === null) router.replace("/onboarding");
  }, [plan, router]);

  const doneInPlan = (workouts ?? []).filter((w: any) => plan && w.planId === plan._id);
  const nextIndex = plan ? doneInPlan.length % plan.days.length : 0;
  const dayIndex = active ?? nextIndex;

  async function retry() {
    if (!deviceId) return;
    setRetrying(true);
    try {
      const res = await generatePlan({ deviceId });
      setAiError(res?.aiError ?? null);
      try {
        if (res?.aiError) sessionStorage.setItem("startfit_ai_error", res.aiError);
        else sessionStorage.removeItem("startfit_ai_error");
      } catch {}
    } finally {
      setRetrying(false);
    }
  }

  if (!plan) {
    return (
      <main className="shell">
        <div className="center-screen"><div className="spinner" aria-hidden /></div>
        <BottomNav />
      </main>
    );
  }

  const day = plan.days[dayIndex];
  const doneThisWeek = (workouts ?? []).filter((w: any) => Date.now() - w.completedAt < 7 * 864e5).length;

  return (
    <main className="shell">
      <div className="row between">
        <div className="eyebrow">Dein Wochenplan</div>
        {plan.source === "ai" ? (
          <span className="badge">✦ KI-generiert</span>
        ) : (
          <span className="badge neutral">Standardplan</span>
        )}
      </div>
      <h1>{doneInPlan.length === 0 ? "Bereit für dein erstes Training?" : `Diese Woche: ${doneThisWeek} von ${plan.days.length}`}</h1>
      <p className="muted">{plan.summary}</p>

      {buddy !== undefined && (
        <Link href="/buddy" className="card mini-buddy" style={{ display: "flex" }}>
          {buddy ? (
            (() => {
              const st = computeStats(workouts ?? [], profile?.daysPerWeek ?? plan.days.length);
              return (
                <>
                  <div className="fig"><BuddyAvatar avatar={buddy.avatar} mood={st.mood} level={st.level} size={60} animate={false} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="row between">
                      <strong>{buddy.buddyName}</strong>
                      <span className="tiny">Lvl {st.level} · ⚡ {st.energy}%</span>
                    </div>
                    <div className="small muted">{moodText(st.mood, buddy.buddyName)}</div>
                  </div>
                </>
              );
            })()
          ) : (
            <>
              <div className="fig"><BuddyAvatar mood="start" size={60} animate={false} /></div>
              <div style={{ flex: 1 }}>
                <strong>Hol dir einen Fitness-Buddy</strong>
                <div className="small muted">Er trainiert mit dir, sammelt XP und freut sich über jedes Training. →</div>
              </div>
            </>
          )}
        </Link>
      )}

      {plan.source === "standard" && (
        <div className="banner">
          {aiError ?? "Das ist dein Standardplan für dein Ziel."} Du kannst mit diesem Plan sofort starten
          oder es nochmal mit der KI versuchen.
          <div style={{ marginTop: 8 }}>
            <button className="btn small secondary" onClick={retry} disabled={retrying}>
              {retrying ? "Wird erstellt …" : "Nochmal versuchen"}
            </button>
          </div>
        </div>
      )}

      {plan.notes.length > 0 && (
        <div className="card flat">
          <div className="eyebrow" style={{ marginBottom: 6 }}>Passend zu deinem Alltag</div>
          {plan.notes.map((n: string, i: number) => (
            <p key={i} className="small muted" style={{ marginBottom: i === plan.notes.length - 1 ? 0 : 8 }}>{n}</p>
          ))}
        </div>
      )}

      <div className="day-tabs" role="tablist">
        {plan.days.map((d: any, i: number) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === dayIndex}
            className={`day-tab ${i === dayIndex ? "active" : ""}`}
            onClick={() => setActive(i)}
          >
            {d.title.split(" · ")[0]}
            {i === nextIndex && <span className="dot" aria-label="nächstes Training" />}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 4 }}>
          <h2 style={{ margin: 0 }}>{day.title.split(" · ")[1] ?? day.title}</h2>
          <span className="tiny">ca. {day.estMinutes} Min.</span>
        </div>
        <p className="small muted">{day.focus}</p>

        {day.exercises.map((e: any, j: number) => {
          const ex = EXERCISE_BY_ID[e.exerciseId];
          if (!ex) return null;
          const key = `${dayIndex}-${j}`;
          return (
            <div key={key} className="ex-row">
              <div className="ex-head">
                <div>
                  <div className="ex-name">{ex.name}</div>
                  <div className="ex-meta">
                    {e.sets > 1 ? `${e.sets} Sätze × ${e.reps}` : e.reps}
                    {ex.category === "mobilitaet" && " · Aufwärmen"}
                  </div>
                </div>
                <button
                  className="why-btn"
                  aria-expanded={!!openWhy[key]}
                  onClick={() => setOpenWhy((o) => ({ ...o, [key]: !o[key] }))}
                >
                  {openWhy[key] ? "Schließen" : "Warum?"}
                </button>
              </div>
              {openWhy[key] && <div className="why-box">{e.why}</div>}
              <div style={{ marginTop: 6 }}>
                <Link className="link" href={`/uebung/${ex.id}`}>So geht&apos;s →</Link>
              </div>
            </div>
          );
        })}
      </div>

      <Link href={`/training/${dayIndex}`} className="btn" style={{ marginBottom: 12 }}>
        {dayIndex === nextIndex ? "Training starten" : "Dieses Training starten"}
      </Link>
      <Link href="/mythen" className="card flat row between" style={{ display: "flex" }}>
        <div>
          <strong>🔎 Mythen-Check</strong>
          <div className="small muted">Tipp aus TikTok oder YouTube gehört? Prüf, ob er stimmt.</div>
        </div>
        <span className="link">→</span>
      </Link>
      <p className="footer-note">
        {plan.source === "ai" ? "Inhalte sind KI-generiert und ersetzen" : "Der Plan ersetzt"} keine ärztliche Beratung.
      </p>
      <BottomNav />
    </main>
  );
}
