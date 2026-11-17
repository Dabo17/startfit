"use client";

import { useAction, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { getOrCreateDeviceId } from "@/lib/device";

type Answers = {
  goal?: string;
  experience?: string;
  daysPerWeek?: number;
  minutes?: number;
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
  { value: "nie", label: "Noch nie trainiert" },
  { value: "unter6", label: "Unter 6 Monate" },
  { value: "neustart", label: "Neustart nach Pause" },
];
const DAYS: Opt<number>[] = [2, 3, 4, 5].map((d) => ({ value: d, label: `${d}×` }));
const MINUTES: Opt<number>[] = [20, 30, 45, 60].map((m) => ({ value: m, label: `${m} Min.` }));
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
}: {
  options: Opt<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
  layout?: "two" | "four";
  name: string;
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
          {o.label}
          {o.sub && <span className="sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

const TOTAL = 5;

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

  const [step, setStep] = useState(0); // 0-4 Fragen, 5 Hinweis, 6 Laden
  const [a, setA] = useState<Answers>(initial ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ackMedical, setAckMedical] = useState(false);
  const [ackPrivacy, setAckPrivacy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    if (s === 2) {
      if (!a.daysPerWeek) e.daysPerWeek = "Bitte wähle, an wie vielen Tagen du trainieren kannst.";
      if (!a.minutes) e.minutes = "Bitte wähle, wie lange eine Einheit dauern darf.";
    }
    if (s === 3 && !a.location) e.location = "Bitte wähle, wo du trainierst.";
    if (s === 4) {
      if (!a.work) e.work = "Bitte wähle die Art deiner Arbeit.";
      if (!a.trainingTime) e.trainingTime = "Bitte wähle, wann du meistens trainierst.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    setSubmitError(null);
    setStep(6);
    try {
      const deviceId = getOrCreateDeviceId();
      await saveProfile({
        deviceId,
        goal: a.goal!,
        experience: a.experience!,
        daysPerWeek: a.daysPerWeek!,
        minutes: a.minutes!,
        location: a.location!,
        work: a.work!,
        trainingTime: a.trainingTime!,
      });
      const res = await generatePlan({ deviceId });
      try {
        if (res?.aiError) sessionStorage.setItem("startfit_ai_error", res.aiError);
        else sessionStorage.removeItem("startfit_ai_error");
      } catch {}
      if (onDone) onDone();
      else router.replace("/plan");
    } catch (e) {
      console.error(e);
      setSubmitError("Das hat nicht geklappt. Bitte prüfe deine Verbindung und versuch es nochmal.");
      setStep(mode === "new" ? 5 : 4);
    }
  }

  function next() {
    if (step <= 4 && !validate(step)) return;
    if (step === 4) {
      if (mode === "edit") submit();
      else setStep(5);
      return;
    }
    setStep(step + 1);
  }

  if (step === 6) {
    return (
      <div className="center-screen">
        <div className="spinner" aria-hidden />
        <h2>{mode === "edit" ? "Dein Plan wird neu erstellt …" : "Dein Coach erstellt deinen Plan …"}</h2>
        <p className="muted">Wir wählen passende Übungen aus und begründen jede einzelne. Das dauert nur ein paar Sekunden.</p>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div>
        <div className="topbar">
          <button className="back" onClick={() => setStep(4)}>← Zurück</button>
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
        {(!ackMedical || !ackPrivacy) && (
          <p className="tiny">Bitte bestätige beide Punkte, um deinen Plan zu erstellen.</p>
        )}
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
    "Wo trainierst du?",
    "Wie sieht dein Alltag aus?",
  ];
  const hints = [
    "Dein Plan richtet Übungen und Wiederholungen danach aus.",
    "So starten wir mit dem passenden Umfang.",
    "Damit der Plan realistisch in deine Woche passt.",
    "Du bekommst nur Übungen, die du dort auch machen kannst.",
    "Damit Belastung und Aufwärmen zu deinem Tag passen.",
  ];

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
          <span className="field-label">Tage pro Woche</span>
          <Options name="Tage pro Woche" layout="four" options={DAYS} value={a.daysPerWeek} onChange={(v) => set({ daysPerWeek: v })} />
          {errors.daysPerWeek && <div className="field-error">{errors.daysPerWeek}</div>}
          <span className="field-label">Minuten pro Einheit</span>
          <Options name="Minuten pro Einheit" layout="four" options={MINUTES} value={a.minutes} onChange={(v) => set({ minutes: v })} />
          {errors.minutes && <div className="field-error">{errors.minutes}</div>}
        </>
      )}
      {step === 3 && (
        <>
          <Options name="Trainingsort" options={LOCATIONS} value={a.location} onChange={(v) => set({ location: v })} />
          {errors.location && <div className="field-error">{errors.location}</div>}
        </>
      )}
      {step === 4 && (
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
        {step === 4 ? (mode === "edit" ? "Speichern & Plan neu erstellen" : "Weiter") : "Weiter"}
      </button>
    </div>
  );
}
