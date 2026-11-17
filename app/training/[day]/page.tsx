"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { EXERCISE_BY_ID } from "@/convex/exercises";
import { useDeviceId } from "@/lib/device";
import { firstNumber, suggestionFor, unitOf } from "@/lib/progression";
import { computeStats } from "@/convex/gamification";
import BuddyAvatar from "@/components/BuddyAvatar";

type SetState = { reps: string; weight: string; done: boolean };

export default function TrainingPage() {
  const params = useParams<{ day: string }>();
  const dayIndex = parseInt(params?.day ?? "0", 10) || 0;
  const router = useRouter();
  const deviceId = useDeviceId();
  const plan = useQuery(api.plans.current, deviceId ? { deviceId } : "skip");
  const workouts = useQuery(api.workouts.list, deviceId ? { deviceId } : "skip");
  const saveWorkout = useMutation(api.workouts.save);
  const setFeedback = useMutation(api.workouts.setFeedback);
  const buddy = useQuery(api.social.me, deviceId ? { deviceId } : "skip");
  const profile = useQuery(api.profiles.get, deviceId ? { deviceId } : "skip");
  const [levelBefore, setLevelBefore] = useState<number | null>(null);

  const [state, setState] = useState<SetState[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const day = plan?.days?.[dayIndex];

  useEffect(() => {
    if (!day || !workouts || state) return;
    setState(
      day.exercises.map((e: any) => {
        const ex = EXERCISE_BY_ID[e.exerciseId];
        const sug = suggestionFor(e.exerciseId, workouts);
        const reps = String(sug.reps ?? firstNumber(e.reps));
        const weight = ex?.usesWeight && sug.weight !== undefined ? String(sug.weight) : "";
        return Array.from({ length: Math.max(1, e.sets) }, () => ({ reps, weight, done: false }));
      }),
    );
  }, [day, workouts, state]);

  if (plan === null) {
    return (
      <main className="shell no-nav">
        <p>Noch kein Plan vorhanden.</p>
        <Link className="btn" href="/onboarding">Plan erstellen</Link>
      </main>
    );
  }
  if (!day || !state || !workouts) {
    return (
      <main className="shell no-nav">
        <div className="center-screen"><div className="spinner" aria-hidden /></div>
      </main>
    );
  }

  const totalSets = state.reduce((n, s) => n + s.length, 0);
  const doneSets = state.reduce((n, s) => n + s.filter((x) => x.done).length, 0);

  function update(i: number, j: number, patch: Partial<SetState>) {
    setState((prev) => prev!.map((sets, a) => (a !== i ? sets : sets.map((s, b) => (b !== j ? s : { ...s, ...patch })))));
    setError(null);
  }

  async function finish() {
    if (doneSets === 0) {
      setError("Hake mindestens einen Satz ab, damit dein Training gespeichert werden kann.");
      return;
    }
    setSaving(true);
    setLevelBefore(computeStats(workouts ?? [], profile?.daysPerWeek ?? 3).level);
    try {
      const id = await saveWorkout({
        deviceId: deviceId!,
        planId: plan!._id,
        dayIndex,
        dayTitle: day.title,
        entries: day.exercises.map((e: any, i: number) => ({
          exerciseId: e.exerciseId,
          sets: state![i].map((s) => {
            const w = parseFloat(s.weight.replace(",", "."));
            const set: { reps: number; done: boolean; weight?: number } = {
              reps: parseInt(s.reps, 10) || 0,
              done: s.done,
            };
            if (Number.isFinite(w)) set.weight = w;
            return set;
          }),
        })),
      });
      setSavedId(id as unknown as string);
    } catch (e) {
      console.error(e);
      setError("Speichern hat nicht geklappt. Bitte versuch es nochmal.");
    } finally {
      setSaving(false);
    }
  }

  async function giveFeedback(fb: "zu_leicht" | "passt" | "zu_schwer" | null) {
    if (fb && savedId && deviceId) {
      try {
        await setFeedback({ deviceId, workoutId: savedId as any, feedback: fb });
      } catch (e) {
        console.error(e);
      }
    }
    router.push(buddy ? "/buddy" : "/fortschritt");
  }

  if (savedId) {
    const after = computeStats(workouts ?? [], profile?.daysPerWeek ?? 3);
    const gained = Math.min(150, 50 + 5 * doneSets);
    const levelUp = levelBefore !== null && after.level > levelBefore;
    return (
      <main className="shell no-nav">
        <div className="center-screen">
          {buddy ? (
            <div><BuddyAvatar avatar={buddy.avatar} mood="top" level={after.level} size={130} /></div>
          ) : (
            <div style={{ fontSize: 48 }} aria-hidden>🎉</div>
          )}
          <h1>Training geschafft!</h1>
          <div className="xp-gain">+{gained} XP</div>
          {levelUp && <div className="banner info">🎉 Level {after.level} erreicht – {after.levelTitle}!</div>}
          {buddy && <p className="small muted">{buddy.buddyName} ist wieder voller Energie.</p>}
          <p className="muted">{doneSets} von {totalSets} Sätzen erledigt. Wie war es für dich?</p>
          <div className="stack" style={{ marginTop: 10 }}>
            <button className="btn secondary" onClick={() => giveFeedback("zu_leicht")}>Zu leicht</button>
            <button className="btn" onClick={() => giveFeedback("passt")}>Passt genau</button>
            <button className="btn secondary" onClick={() => giveFeedback("zu_schwer")}>Zu schwer</button>
            <button className="btn ghost" onClick={() => giveFeedback(null)}>Überspringen</button>
          </div>
          <p className="tiny" style={{ marginTop: 12 }}>Dein nächstes Training passt Gewicht oder Wiederholungen daran an. Check-in: +10 XP.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="shell no-nav">
      <div className="topbar">
        <Link className="back" href="/plan">← Plan</Link>
        <span className="tiny">{doneSets}/{totalSets} Sätze</span>
      </div>
      <div className="progress-track" aria-hidden>
        <div className="progress-fill" style={{ width: `${(doneSets / totalSets) * 100}%` }} />
      </div>
      <h1 style={{ marginTop: 16 }}>{day.title.split(" · ")[1] ?? day.title}</h1>
      <p className="muted small">Trag pro Satz Wiederholungen{" "}und Gewicht ein und hake ihn ab.</p>

      {day.exercises.map((e: any, i: number) => {
        const ex = EXERCISE_BY_ID[e.exerciseId];
        if (!ex) return null;
        const unit = unitOf(e.reps);
        const sug = suggestionFor(e.exerciseId, workouts);
        const withWeight = ex.usesWeight;
        return (
          <div key={i} className="card">
            <div className="ex-head">
              <div>
                <div className="ex-name">{ex.name}</div>
                <div className="ex-meta">Ziel: {e.sets > 1 ? `${e.sets} × ${e.reps}` : e.reps}</div>
              </div>
              <Link className="link" href={`/uebung/${ex.id}`}>Anleitung</Link>
            </div>
            {sug.reason && <div className="suggest">↗ {sug.reason}</div>}
            {state[i].map((s, j) => (
              <div key={j} className={`set-row ${withWeight ? "" : "noweight"}`}>
                <div className="set-num">{j + 1}</div>
                <div className="num-wrap">
                  <input
                    className="num-input"
                    inputMode="numeric"
                    aria-label={`Satz ${j + 1} ${unit}`}
                    value={s.reps}
                    onChange={(ev) => update(i, j, { reps: ev.target.value.replace(/[^0-9]/g, "") })}
                  />
                  <span>{unit}</span>
                </div>
                {withWeight && (
                  <div className="num-wrap">
                    <input
                      className="num-input"
                      inputMode="decimal"
                      placeholder="0"
                      aria-label={`Satz ${j + 1} Gewicht in kg`}
                      value={s.weight}
                      onChange={(ev) => update(i, j, { weight: ev.target.value.replace(/[^0-9.,]/g, "") })}
                    />
                    <span>kg</span>
                  </div>
                )}
                <button
                  className={`check ${s.done ? "on" : ""}`}
                  aria-pressed={s.done}
                  aria-label={`Satz ${j + 1} abhaken`}
                  onClick={() => update(i, j, { done: !s.done })}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        );
      })}

      {error && <div className="banner">{error}</div>}
      <button className="btn" onClick={finish} disabled={saving}>
        {saving ? "Wird gespeichert …" : "Training beenden"}
      </button>
    </main>
  );
}
