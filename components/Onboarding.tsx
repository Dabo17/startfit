"use client";

import { useAction, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { LABELS, formatMinutes, recommendedSplit } from "@/convex/planLogic";
import { getToken } from "@/lib/session";

type Answers = {
  goal?: string;
  experience?: string;
  daysPerWeek?: number;
  minutes?: number;
  split?: string;
  location?: string;
  work?: string;
  trainingTime?: string;
};

type Opt<T> = { value: T; label: string; sub?: string };

const GOALS: Opt<string>[] = [
  { value: "muskelaufbau", label: "Muskelaufbau", sub: "Kräftiger werden, Muskeln aufbauen" },
  { value: "abnehmen", label: "Abnehmen", sub: "Körperfett reduzieren" },
  { value: "ausdauer", label: "Ausdauer", sub: "Länger durchhalten, fitter atmen" },
  { value: "fitness", label: "Allgemeine Fitness", sub: "Fit und belastbar im Alltag" },
];
const EXPERIENCE: Opt<string>[] = [
  { value: "nie", label: "Noch nie trainiert", sub: "Ich fange ganz neu an" },
  { value: "unter6", label: "Unter 6 Monate", sub: "Ich habe vor Kurzem angefangen" },
  { value: "neustart", label: "Neustart nach Pause", sub: "Ich habe früher trainiert und steige wieder ein" },
  { value: "aktiv", label: "Ich trainiere bereits aktiv", sub: "Regelmäßig seit mehr als 6 Monaten" },
];

const DAY_STOPS = [1, 2, 3, 4, 5, 6, 7];
const DAY_HINTS: Record<number, string> = {
  1: "Ein fester Termin pro Woche – ein guter Anfang, um eine Routine aufzubauen.",
  2: "Ideal für den Einstieg – gut in jeden Alltag einzubauen.",
  3: "Empfohlen für Einsteiger: genug Training, genug Erholung.",
  4: "Ambitioniert – ein Split teilt die Muskelgruppen sinnvoll auf.",
  5: "Viel Training – Ruhetage für einzelne Muskelgruppen bleiben wichtig.",
  6: "Sehr viel: Dein Plan wechselt die Muskelgruppen, damit sie sich erholen.",
  7: "Täglich: Plane bewusst lockere Tage ein und hör auf deinen Körper.",
};
const MINUTE_STOPS = [20, 30, 45, 60, 75, 90, 120, 150, 180];
const MINUTE_TICKS: Record<number, string> = { 20: "20", 30: "30", 45: "45", 60: "1h", 75: "1¼", 90: "1½", 120: "2h", 150: "2½", 180: "3h" };
function minuteHint(m: number) {
  if (m <= 20) return "Kurz und knackig – perfekt für volle Tage.";
  if (m <= 30) return "Kompakt: Aufwärmen plus die wichtigsten Übungen.";
  if (m <= 45) return "Genug Zeit für einen vollständigen Plan.";
  if (m <= 60) return "Eine Stunde: mehr Übungen und Sätze, optional Ausdauer.";
  if (m <= 90) return "Viel Zeit: mehr Volumen, längeres Aufwärmen und Cool-down.";
  return "Sehr lange Einheiten: inklusive Ausdauer-Block – Qualität geht vor Dauer.";
}

const SPLITS: Opt<string>[] = [
  { value: "ganzkoerper", label: "Ganzkörperplan", sub: "Jede Einheit trainiert den ganzen Körper" },
  { value: "split2", label: "2er-Split", sub: "Abwechselnd Oberkörper und Unterkörper" },
  { value: "split3", label: "3er-Split", sub: "Drücken (Brust, Schultern, Trizeps) · Ziehen (Rücken, Bizeps) · Beine" },
  { value: "split4", label: "4er-Split", sub: "Brust & Trizeps · Rücken & Bizeps · Beine & Po · Schultern & Bauch" },
];
const SPLIT_SESSIONS: Record<string, number> = { ganzkoerper: 1, split2: 2, split3: 3, split4: 4 };

const LOCATIONS: Opt<string>[] = [
  { value: "gym", label: "Fitnessstudio", sub: "Maschinen, Hanteln, Kabelzug" },
  { value: "home_none", label: "Zuhause ohne Geräte", sub: "Nur mit eigenem Körpergewicht" },
  { value: "home_db", label: "Zuhause mit Kurzhanteln", sub: "Körpergewicht + Kurzhanteln" },
];
const WORK: Opt<string>[] = [
  { value: "sitzend", label: "Überwiegend sitzend", sub: "z. B. Büro, Studium" },
  { value: "gemischt", label: "Stehend oder gemischt", sub: "z. B. Handel, Pflege, Service" },
  { value: "schwer", label: "Körperlich schwer", sub: "z. B. Bau, Lager, Handwerk" },
];
const TIMES: Opt<string>[] = [
  { value: "morgens", label: "Morgens" },
  { value: "mittags", label: "Mittags" },
  { value: "abends", label: "Abends" },
  { value: "wechselnd", label: "Wechselnd", sub: "z. B. Schicht" },
];

function Options<T extends string | number>({
  options,
  value,
  onChange,
  layout,
  name,
  badge,
}: {
  options: Opt<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
  layout?: "two" | "four";
  name: string;
  badge?: { value: T; label: string };
}) {
  return (
    <div className={`options ${layout ?? ""}`} role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`option ${layout ? "center" : ""} ${value === o.value ? "selected" : ""}`}
          onClick={() => onChange(o.value)}
        >
          <span className="row between" style={{ gap: 8 }}>
            <span>{o.label}</span>
            {badge && badge.value === o.value && <span className="badge">{badge.label}</span>}
          </span>
          {o.sub && <span className="sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

function StepSlider({
  label,
  stops,
  value,
  onChange,
  format,
  tick,
  hint,
}: {
  label: string;
  stops: number[];
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  tick?: (v: number) => string;
  hint: string;
}) {
  const index = Math.max(0, stops.indexOf(value));
  const pct = (index / (stops.length - 1)) * 100;
  return (
    <div className="slider-card">
      <div className="slider-head">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{format(value)}</span>
      </div>
      <input
        type="range"
        className="range"
        min={0}
        max={stops.length - 1}
        step={1}
        value={index}
        aria-label={label}
        aria-valuetext={format(value)}
        style={{ ["--pct" as any]: `${pct}%` }}
        onChange={(e) => onChange(stops[parseInt(e.target.value, 10)])}
      />
      <div className="slider-ticks">
        {stops.map((s) => (
          <button key={s} type="button" className={s === value ? "on" : ""} onClick={() => onChange(s)} aria-label={format(s)}>
            {tick ? tick(s) : s}
          </button>
        ))}
      </div>
      <p className="tiny" style={{ margin: "8px 0 0" }}>{hint}</p>
    </div>
  );
}

// Schritte: 0 Ziel · 1 Erfahrung · 2 Zeit · 3 Plan-Art · 4 Ort · 5 Alltag · 6 Hinweis · 7 Laden
const TOTAL = 6;
const LAST_QUESTION = 5;
const DISCLAIMER = 6;
const LOADING = 7;

export default function Onboarding({
  initial,
  mode = "new",
  onDone,
}: {
  initial?: Answers;
  mode?: "new" | "edit";
  onDone?: () => void;
}) {
  const router = useRouter();
  const saveProfile = useMutation(api.profiles.save);
  const generatePlan = useAction(api.ai.generatePlan);

  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({ daysPerWeek: 3, minutes: 45, ...(initial ?? {}) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ackMedical, setAckMedical] = useState(false);
  const [ackPrivacy, setAckPrivacy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const days = a.daysPerWeek ?? 3;
  const minutes = a.minutes ?? 45;
  const recommended = recommendedSplit(days);

  const set = (patch: Answers) => {
    setA((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  function validate(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0 && !a.goal) e.goal = "Bitte wähle dein Ziel.";
    if (s === 1 && !a.experience) e.experience = "Bitte wähle deine Erfahrung.";
    if (s === 3 && !a.split) e.split = "Bitte wähle eine Plan-Art.";
    if (s === 4 && !a.location) e.location = "Bitte wähle, wo du trainierst.";
    if (s === 5) {
      if (!a.work) e.work = "Bitte wähle die Art deiner Arbeit.";
      if (!a.trainingTime) e.trainingTime = "Bitte wähle, wann du meistens trainierst.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    setSubmitError(null);
    setStep(LOADING);
    try {
      const token = getToken() ?? "";
      await saveProfile({
        token,
        goal: a.goal!,
        experience: a.experience!,
        daysPerWeek: days,
        minutes,
        split: a.split ?? recommended,
        location: a.location!,
        work: a.work!,
        trainingTime: a.trainingTime!,
      });
      const res = await generatePlan({ token });
      try {
        if (res?.aiError) sessionStorage.setItem("startfit_ai_error", res.aiError);
        else sessionStorage.removeItem("startfit_ai_error");
      } catch {}
      if (onDone) onDone();
      else router.replace("/plan");
    } catch (e) {
      console.error(e);
      setSubmitError("Das hat nicht geklappt. Bitte prüfe deine Verbindung und versuch es nochmal.");
      setStep(mode === "new" ? DISCLAIMER : LAST_QUESTION);
    }
  }

  function next() {
    if (step <= LAST_QUESTION && !validate(step)) return;
    if (step === 2 && !a.split) set({ split: recommended }); // Empfehlung vorauswählen
    if (step === LAST_QUESTION) {
      if (mode === "edit") submit();
      else setStep(DISCLAIMER);
      return;
    }
    setStep(step + 1);
  }

  if (step === LOADING) {
    return (
      <div className="center-screen">
        <div className="spinner" aria-hidden />
        <h2>{mode === "edit" ? "Dein Plan wird neu erstellt …" : "Dein Coach erstellt deinen Plan …"}</h2>
        <p className="muted">Wir wählen passende Übungen aus und begründen jede einzelne. Das dauert nur ein paar Sekunden.</p>
      </div>
    );
  }

  if (step === DISCLAIMER) {
    return (
      <div>
        <div className="topbar">
          <button className="back" onClick={() => setStep(LAST_QUESTION)}>← Zurück</button>
          <span className="tiny">Fast geschafft</span>
        </div>
        <h1>Bevor es losgeht</h1>
        <div className="card flat">
          <h3 style={{ marginBottom: 6 }}>StartFit ersetzt keinen Arzt</h3>
          <p className="muted small" style={{ margin: 0 }}>
            Wenn du Schmerzen, Vorerkrankungen oder Verletzungen hast, kläre dein Training bitte vorher ärztlich ab.
            Hör während des Trainings auf deinen Körper und brich bei Schmerzen ab.
          </p>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={ackMedical} onChange={(e) => setAckMedical(e.target.checked)} />
          <span>Ich habe den Hinweis gelesen und verstanden.</span>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={ackPrivacy} onChange={(e) => setAckPrivacy(e.target.checked)} />
          <span className="small">
            Ich willige ein, dass meine Antworten (keine Gesundheitsdaten) gespeichert und zur Planerstellung von
            einer KI verarbeitet werden. Ich kann alles jederzeit im Profil löschen.
          </span>
        </label>
        {(!ackMedical || !ackPrivacy) && <p className="tiny">Bitte bestätige beide Punkte, um deinen Plan zu erstellen.</p>}
        {submitError && <div className="banner">{submitError}</div>}
        <button className="btn" disabled={!ackMedical || !ackPrivacy} onClick={submit} style={{ marginTop: 8 }}>
          Meinen Plan erstellen
        </button>
      </div>
    );
  }

  const titles = [
    "Was ist dein Ziel?",
    "Wie viel Erfahrung hast du?",
    "Wie viel Zeit hast du?",
    "Wie möchtest du trainieren?",
    "Wo trainierst du?",
    "Wie sieht dein Alltag aus?",
  ];
  const hints = [
    "Dein Plan richtet Übungen und Wiederholungen danach aus.",
    "So starten wir mit dem passenden Umfang.",
    "Schieb die Regler – damit der Plan realistisch in deine Woche passt.",
    `Bei ${days}× pro Woche empfehlen wir: ${LABELS.split[recommended]}.`,
    "Du bekommst nur Übungen, die du dort auch machen kannst.",
    "Damit Belastung und Aufwärmen zu deinem Tag passen.",
  ];

  const sessionsNeeded = SPLIT_SESSIONS[a.split ?? recommended] ?? 1;
  const splitWarning =
    a.split && sessionsNeeded > days
      ? `Achtung: Ein ${LABELS.split[a.split as keyof typeof LABELS.split]} hat ${sessionsNeeded} verschiedene Einheiten – bei ${days}× pro Woche trainierst du manche Muskelgruppen nur alle ${Math.ceil(sessionsNeeded / days)} Wochen.`
      : null;

  return (
    <div>
      <div className="topbar">
        {step > 0 ? (
          <button className="back" onClick={() => setStep(step - 1)}>← Zurück</button>
        ) : mode === "edit" && onDone ? (
          <button className="back" onClick={onDone}>← Abbrechen</button>
        ) : (
          <span />
        )}
        <span className="tiny">Frage {step + 1} von {TOTAL}</span>
      </div>
      <div className="progress-track" aria-hidden>
        <div className="progress-fill" style={{ width: `${((step + 1) / TOTAL) * 100}%` }} />
      </div>
      <h1 style={{ marginTop: 20 }}>{titles[step]}</h1>
      <p className="muted">{hints[step]}</p>

      {step === 0 && (
        <>
          <Options name="Ziel" options={GOALS} value={a.goal} onChange={(v) => set({ goal: v })} />
          {errors.goal && <div className="field-error">{errors.goal}</div>}
        </>
      )}
      {step === 1 && (
        <>
          <Options name="Erfahrung" options={EXPERIENCE} value={a.experience} onChange={(v) => set({ experience: v })} />
          {errors.experience && <div className="field-error">{errors.experience}</div>}
        </>
      )}
      {step === 2 && (
        <>
          <StepSlider
            label="Tage pro Woche"
            stops={DAY_STOPS}
            value={days}
            onChange={(v) => set({ daysPerWeek: v })}
            format={(v) => `${v}×`}
            hint={DAY_HINTS[days]}
          />
          <StepSlider
            label="Zeit pro Einheit"
            stops={MINUTE_STOPS}
            value={minutes}
            onChange={(v) => set({ minutes: v })}
            format={formatMinutes}
            tick={(v) => MINUTE_TICKS[v]}
            hint={minuteHint(minutes)}
          />
          <div className="banner info" style={{ marginTop: 4 }}>
            Das sind ca. <strong>{formatMinutes(days * minutes)}</strong> Training pro Woche.
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <Options
            name="Plan-Art"
            options={SPLITS}
            value={a.split}
            onChange={(v) => set({ split: v })}
            badge={{ value: recommended, label: "Empfohlen" }}
          />
          {errors.split && <div className="field-error">{errors.split}</div>}
          {splitWarning && <div className="banner" style={{ marginTop: 12 }}>{splitWarning}</div>}
        </>
      )}
      {step === 4 && (
        <>
          <Options name="Trainingsort" options={LOCATIONS} value={a.location} onChange={(v) => set({ location: v })} />
          {errors.location && <div className="field-error">{errors.location}</div>}
        </>
      )}
      {step === 5 && (
        <>
          <span className="field-label">Art der Arbeit</span>
          <Options name="Art der Arbeit" options={WORK} value={a.work} onChange={(v) => set({ work: v })} />
          {errors.work && <div className="field-error">{errors.work}</div>}
          <span className="field-label">Wann trainierst du meistens?</span>
          <Options name="Trainingszeit" layout="two" options={TIMES} value={a.trainingTime} onChange={(v) => set({ trainingTime: v })} />
          {errors.trainingTime && <div className="field-error">{errors.trainingTime}</div>}
        </>
      )}

      {submitError && <div className="banner" style={{ marginTop: 12 }}>{submitError}</div>}
      <button className="btn" style={{ marginTop: 24 }} onClick={next}>
        {step === LAST_QUESTION && mode === "edit" ? "Speichern & Plan neu erstellen" : "Weiter"}
      </button>
    </div>
  );
}
