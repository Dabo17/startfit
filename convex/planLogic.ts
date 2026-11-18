// Regelbasierte Plan-Logik: liefert den Standardplan (Fallback) und das Gerüst,
// das die KI personalisiert. Reines TypeScript – läuft in Convex und im Browser.
import { EXERCISE_BY_ID, Exercise, Group, Location, exercisesForLocation } from "./exercises";

export type Goal = "muskelaufbau" | "abnehmen" | "ausdauer" | "fitness";
export type Experience = "nie" | "unter6" | "neustart" | "aktiv";
export type Work = "sitzend" | "gemischt" | "schwer";
export type TrainingTime = "morgens" | "mittags" | "abends" | "wechselnd";
export type Split = "ganzkoerper" | "split2" | "split3" | "split4";

export type ProfileInput = {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number; // 1–7
  minutes: number; // 20–180
  location: Location;
  work: Work;
  trainingTime: TrainingTime;
  split?: Split;
  age?: number;
};

export type PlanExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
  why: string;
};

export type PlanDay = {
  title: string;
  focus: string;
  estMinutes: number;
  exercises: PlanExercise[];
};

export type PlanData = {
  summary: string;
  notes: string[];
  days: PlanDay[];
};

export const LABELS = {
  goal: {
    muskelaufbau: "Muskelaufbau",
    abnehmen: "Abnehmen",
    ausdauer: "Ausdauer",
    fitness: "Allgemeine Fitness",
  },
  experience: {
    nie: "Noch nie trainiert",
    unter6: "Unter 6 Monate",
    neustart: "Neustart nach Pause",
    aktiv: "Trainiere bereits aktiv",
  },
  location: {
    gym: "Fitnessstudio",
    home_none: "Zuhause ohne Geräte",
    home_db: "Zuhause mit Kurzhanteln",
  },
  work: {
    sitzend: "Überwiegend sitzend",
    gemischt: "Stehend oder gemischt",
    schwer: "Körperlich schwer",
  },
  trainingTime: {
    morgens: "Morgens",
    mittags: "Mittags",
    abends: "Abends",
    wechselnd: "Wechselnd (z. B. Schicht)",
  },
  split: {
    ganzkoerper: "Ganzkörperplan",
    split2: "2er-Split (Ober-/Unterkörper)",
    split3: "3er-Split (Drücken/Ziehen/Beine)",
    split4: "4er-Split (Brust/Rücken/Beine/Schultern)",
  },
} as const;

export function recommendedSplit(days: number): Split {
  if (days <= 3) return "ganzkoerper";
  if (days === 4) return "split2";
  if (days <= 6) return "split3";
  return "split4";
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} Min.`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} Std.` : `${h} Std. ${m} Min.`;
}

type Session = { title: string; focus: string; groups: Group[] };

const SESSIONS: Record<Split, Session[]> = {
  ganzkoerper: [
    {
      title: "Ganzkörper A",
      focus: "Beine, Brust, Rücken, Bauch",
      groups: ["beine", "brust", "ruecken", "po", "schultern", "bauch", "beine", "ruecken", "brust", "bizeps", "trizeps", "bauch"],
    },
    {
      title: "Ganzkörper B",
      focus: "Po, Rücken, Brust, Schultern",
      groups: ["po", "ruecken", "brust", "beine", "schultern", "bauch", "ruecken", "beine", "brust", "trizeps", "bizeps", "bauch"],
    },
  ],
  split2: [
    {
      title: "Oberkörper",
      focus: "Brust, Rücken, Schultern, Arme",
      groups: ["brust", "ruecken", "schultern", "brust", "ruecken", "bizeps", "trizeps", "schultern", "bauch", "ruecken"],
    },
    {
      title: "Unterkörper & Bauch",
      focus: "Beine, Po, Bauch",
      groups: ["beine", "po", "beine", "po", "bauch", "beine", "bauch", "po", "bauch"],
    },
  ],
  split3: [
    { title: "Drücken", focus: "Brust, Schultern, Trizeps", groups: ["brust", "schultern", "brust", "trizeps", "schultern", "trizeps", "bauch", "brust"] },
    { title: "Ziehen", focus: "Rücken, Bizeps, Körperrückseite", groups: ["ruecken", "ruecken", "bizeps", "ruecken", "po", "bizeps", "bauch", "ruecken"] },
    { title: "Beine & Po", focus: "Oberschenkel, Po, Waden, Bauch", groups: ["beine", "po", "beine", "po", "beine", "bauch", "bauch"] },
  ],
  split4: [
    { title: "Brust & Trizeps", focus: "Brust, Armrückseite", groups: ["brust", "brust", "trizeps", "brust", "trizeps", "bauch"] },
    { title: "Rücken & Bizeps", focus: "Rücken, Armvorderseite", groups: ["ruecken", "ruecken", "bizeps", "ruecken", "bizeps", "bauch"] },
    { title: "Beine & Po", focus: "Oberschenkel, Po, Waden", groups: ["beine", "po", "beine", "po", "beine", "po"] },
    { title: "Schultern & Bauch", focus: "Schultern, Körpermitte", groups: ["schultern", "schultern", "schultern", "bauch", "bauch", "bauch"] },
  ],
};

const SITTING_MOBILITY = ["hueftbeuger_dehnung", "katze_kuh", "brustwirbel_rotation"];
const GENERAL_MOBILITY = ["weltbeste_dehnung", "katze_kuh", "brustwirbel_rotation", "hueftbeuger_dehnung"];
// Cool-down wird nur am Ende eingeplant, nicht als Aufwärmübung

const WEEKDAY_SLOTS: Record<number, string[]> = {
  1: ["Mittwoch"],
  2: ["Montag", "Donnerstag"],
  3: ["Montag", "Mittwoch", "Freitag"],
  4: ["Montag", "Dienstag", "Donnerstag", "Freitag"],
  5: ["Montag", "Dienstag", "Mittwoch", "Freitag", "Samstag"],
  6: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  7: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
};

export function weekdayLabel(days: number, index: number): string {
  return WEEKDAY_SLOTS[days]?.[index] ?? `Tag ${index + 1}`;
}

export function repsFor(goal: Goal, ex: Exercise): string {
  if (ex.category === "ausdauer") return ex.equipment === "gym" || ex.id === "joggen" ? "10 Min." : "30 Sek.";
  if (ex.category === "mobilitaet") return ex.unit === "sek" ? "30 Sek. je Seite" : "8 Wdh.";
  if (ex.unit === "sek") return goal === "ausdauer" ? "40 Sek." : "30 Sek.";
  switch (goal) {
    case "muskelaufbau":
      return "8–12 Wdh.";
    case "abnehmen":
      return "12–15 Wdh.";
    case "ausdauer":
      return "15–20 Wdh.";
    default:
      return "10–12 Wdh.";
  }
}

function goalPhrase(goal: Goal, ex: Exercise): string {
  if (ex.category === "mobilitaet") return "Als Aufwärmen bereitet sie deinen Körper auf das Training vor.";
  if (ex.category === "ausdauer") {
    if (goal === "abnehmen") return "Für dein Ziel Abnehmen: Hier verbrauchst du besonders viel Energie.";
    if (goal === "ausdauer") return "Direkt für dein Ziel: Herz und Lunge werden leistungsfähiger.";
    return "Bringt deinen Kreislauf in Schwung und rundet das Training ab.";
  }
  switch (goal) {
    case "muskelaufbau":
      return "Für deinen Muskelaufbau: Hier steigerst du mit der Zeit Gewicht oder Wiederholungen.";
    case "abnehmen":
      return "Für dein Ziel Abnehmen: Mehr Muskeln verbrauchen auch in Ruhe mehr Energie.";
    case "ausdauer":
      return "Für deine Ausdauer: Kräftige Muskeln ermüden langsamer.";
    default:
      return "Für deine Fitness: Macht dich im Alltag belastbarer.";
  }
}

export function fallbackWhy(p: ProfileInput, ex: Exercise): string {
  const extra = p.work === "sitzend" && ex.sittingWhy ? ex.sittingWhy : goalPhrase(p.goal, ex);
  return `${ex.baseWhy} ${extra}`;
}

const EQUIP_ORDER = { gym: 0, dumbbell: 1, bodyweight: 2 } as const;

// Leichtere bzw. schwerere Varianten passend zur Erfahrung ausblenden
const SKIP_FOR: Partial<Record<Experience, string[]>> = {
  nie: ["liegestuetz"],
  aktiv: ["liegestuetz_erhoeht"],
};

function pickFromGroup(
  location: Location,
  group: Group,
  variant: number,
  used: Set<string>,
  experience: Experience,
): Exercise | null {
  const skip = SKIP_FOR[experience] ?? [];
  const c = exercisesForLocation(location)
    .filter((e) => e.group === group && e.category === "kraft" && !used.has(e.id) && !skip.includes(e.id))
    .sort((a, b) => EQUIP_ORDER[a.equipment] - EQUIP_ORDER[b.equipment]);
  if (c.length === 0) return null;
  return c[variant % c.length];
}

function baseSets(p: ProfileInput): { sets: number; maxSets: number } {
  let sets = p.experience === "nie" ? 2 : 3;
  let maxSets = p.experience === "nie" ? 4 : 5;
  if (p.work === "schwer") {
    sets = Math.max(2, sets - 1);
    maxSets = 3;
  }
  return { sets, maxSets };
}

/** Erstellt den regelbasierten Standardplan. */
export function buildStandardPlan(p: ProfileInput): PlanData {
  const days = Math.max(1, Math.min(7, Math.round(p.daysPerWeek)));
  const minutes = Math.max(15, Math.min(180, Math.round(p.minutes)));
  const split = p.split ?? recommendedSplit(days);
  const sessions = SESSIONS[split];
  const { sets: startSets, maxSets } = baseSets(p);
  const perSet = minutes >= 75 ? 2.5 : 2; // längere Einheiten: realistischere Pausen
  const wantsCardio = p.goal === "abnehmen" || p.goal === "ausdauer";
  const cardioCap = minutes >= 150 ? 75 : p.goal === "ausdauer" || minutes >= 120 ? 60 : 45;
  let maxStrength = p.experience === "aktiv" ? 10 : 8;
  if (p.work === "schwer") maxStrength -= 1; // weniger Volumen bei körperlich schwerer Arbeit

  const planDays: PlanDay[] = Array.from({ length: days }, (_, dayIndex) => {
    const session = sessions[dayIndex % sessions.length];
    const variant = Math.floor(dayIndex / sessions.length);
    const used = new Set<string>();
    const exercises: PlanExercise[] = [];

    // 1) Aufwärmen / Mobilität
    let mobilityCount = 1;
    if (p.work === "sitzend" || p.trainingTime === "morgens") mobilityCount++;
    if (minutes >= 90) mobilityCount++;
    const pool = p.work === "sitzend" ? SITTING_MOBILITY.concat(["weltbeste_dehnung"]) : GENERAL_MOBILITY;
    for (let i = 0; i < mobilityCount; i++) {
      const id = pool[(dayIndex + i) % pool.length];
      if (used.has(id)) continue;
      used.add(id);
      const ex = EXERCISE_BY_ID[id];
      exercises.push({ exerciseId: id, sets: 1, reps: repsFor(p.goal, ex), why: fallbackWhy(p, ex) });
    }
    const warmupMin = exercises.length * 3;

    // 2) Kraftübungen nach Muskelgruppen der Einheit
    let cardioMin = wantsCardio ? (minutes <= 30 ? 5 : minutes <= 60 ? 10 : 15) : 0;
    const target = Math.max(2, Math.min(maxStrength, Math.floor((minutes - warmupMin - cardioMin) / (startSets * perSet))));
    const strength: Exercise[] = [];
    let misses = 0;
    for (let i = 0; strength.length < target && misses < session.groups.length; i++) {
      const group = session.groups[i % session.groups.length];
      const ex = pickFromGroup(p.location, group, variant + Math.floor(i / session.groups.length), used, p.experience);
      if (!ex) {
        misses++;
        continue;
      }
      misses = 0;
      used.add(ex.id);
      strength.push(ex);
    }

    // 3) Sätze erhöhen, solange die Zeit es hergibt
    let sets = startSets;
    const strengthMin = () => strength.length * sets * perSet;
    while (sets < maxSets && warmupMin + strength.length * (sets + 1) * perSet + cardioMin <= minutes + 2) sets++;
    for (const ex of strength) {
      exercises.push({ exerciseId: ex.id, sets, reps: repsFor(p.goal, ex), why: fallbackWhy(p, ex) });
    }

    // 4) Restzeit mit Ausdauer und – bei langen Einheiten – Cool-down füllen
    const cooldownMin = minutes >= 90 ? Math.min(20, Math.max(10, Math.round(minutes / 9))) : 0;
    const rest = minutes - warmupMin - strengthMin() - cardioMin - cooldownMin;
    if (rest >= 4) cardioMin = Math.min(cardioCap, Math.max(5, cardioMin + rest));
    if (cardioMin > 0) {
      const gymCardio = ["ergometer", "crosstrainer"];
      let id: string;
      if (p.location === "gym") id = gymCardio[dayIndex % 2];
      else id = cardioMin > 10 ? "joggen" : dayIndex % 2 === 0 ? "hampelmann" : "mountain_climbers";
      const ex = EXERCISE_BY_ID[id];
      const continuous = ex.equipment === "gym" || id === "joggen";
      exercises.push({
        exerciseId: id,
        sets: continuous ? 1 : Math.max(3, Math.round(cardioMin)),
        reps: continuous ? `${cardioMin} Min.` : "30 Sek.",
        why: fallbackWhy(p, ex),
      });
    }

    if (cooldownMin > 0) {
      const ex = EXERCISE_BY_ID["cooldown"];
      exercises.push({ exerciseId: "cooldown", sets: 1, reps: `${cooldownMin} Min.`, why: p.work === "sitzend" && ex.sittingWhy ? `${ex.baseWhy} ${ex.sittingWhy}` : ex.baseWhy });
    }

    const est = Math.round(warmupMin + strengthMin() + cardioMin + cooldownMin);
    return {
      title: `${weekdayLabel(days, dayIndex)} · ${session.title}`,
      focus: session.focus,
      estMinutes: est,
      exercises,
    };
  });

  const notes = buildNotes({ ...p, daysPerWeek: days, minutes, split });
  const longest = Math.max(...planDays.map((d) => d.estMinutes));
  if (longest < minutes - 10)
    notes.unshift(
      `Deine Einheiten dauern ca. ${formatMinutes(longest)} statt ${formatMinutes(minutes)}: Mehr Volumen bringt auf deinem Niveau keinen zusätzlichen Nutzen, sondern erhöht nur das Verletzungsrisiko.`,
    );

  return {
    summary: `Dein Plan: ${days}× pro Woche je ca. ${formatMinutes(minutes)}, ${LABELS.split[split]}, ausgerichtet auf ${LABELS.goal[p.goal]} (${LABELS.location[p.location]}).`,
    notes,
    days: planDays,
  };
}

export function buildNotes(p: ProfileInput): string[] {
  const notes: string[] = [];
  const split = p.split ?? recommendedSplit(p.daysPerWeek);
  if (split === "ganzkoerper" && p.daysPerWeek >= 5)
    notes.push("Ganzkörper an vielen Tagen: Halte die Intensität moderat – für 5+ Tage passt ein Split oft besser.");
  if (split !== "ganzkoerper")
    notes.push(`${LABELS.split[split]}: Jede Einheit trainiert andere Muskelgruppen, damit sich die übrigen erholen können.`);
  if (p.daysPerWeek >= 6)
    notes.push("Bei 6–7 Tagen: Plane mindestens einen lockeren Tag ein und hör auf deinen Körper.");
  if (p.minutes >= 120)
    notes.push("Lange Einheiten: Trink zwischendurch und halte die Pausen ein – Qualität geht vor Dauer.");
  if (p.work === "schwer")
    notes.push("Weil deine Arbeit körperlich schwer ist, hat dein Plan weniger Sätze und mehr Ruhetage zur Regeneration.");
  if (p.work === "sitzend")
    notes.push("Weil du viel sitzt, starten deine Einheiten mit Mobilitätsübungen für Rücken und Hüfte.");
  if (p.trainingTime === "morgens")
    notes.push("Morgens ist der Körper noch steif – nimm dir das Aufwärmen deshalb besonders zu Herzen.");
  if (p.trainingTime === "abends")
    notes.push("Abends: Plane das Training mind. 2 Stunden vor dem Schlafen ein, damit du gut zur Ruhe kommst.");
  if (p.trainingTime === "wechselnd")
    notes.push("Bei wechselnden Zeiten: Die Wochentage sind nur ein Vorschlag – wichtig ist Erholung für jede Muskelgruppe.");
  if (p.experience === "nie")
    notes.push("Als Einsteiger startest du mit wenigen Sätzen und leichtem Gewicht. Saubere Technik geht vor.");
  if (p.experience === "neustart")
    notes.push("Nach einer Pause: Starte bewusst leichter als früher – du wirst schnell wieder reinkommen.");
  if (p.experience === "aktiv")
    notes.push("Du trainierst bereits: Dein Plan hat mehr Übungen und Sätze. Steigere das Gewicht, sobald alle Wiederholungen sauber klappen.");
  if (p.age !== undefined && p.age < 18)
    notes.push("Unter 18: Konzentrier dich auf saubere Technik und moderates Gewicht statt Maximalleistung.");
  if (p.age !== undefined && p.age >= 50)
    notes.push("Gründliches Aufwärmen und saubere Technik sind besonders wichtig – steigere dich in kleinen Schritten.");
  return notes;
}

/**
 * Prüft eine KI-Antwort gegen die kuratierte Liste und das Gerüst.
 * Ungültige Übungen werden durch die Gerüst-Übung ersetzt.
 */
export function validateAiPlan(raw: any, skeleton: PlanData, p: ProfileInput): PlanData | null {
  if (!raw || !Array.isArray(raw.days) || raw.days.length !== skeleton.days.length) return null;
  const allowed = new Set(exercisesForLocation(p.location).map((e) => e.id));
  const days: PlanDay[] = skeleton.days.map((skDay, i) => {
    const aiDay = raw.days[i] ?? {};
    const aiEx: any[] = Array.isArray(aiDay.exercises) ? aiDay.exercises : [];
    const seen = new Set<string>();
    const exercises: PlanExercise[] = [];
    aiEx.forEach((e, j) => {
      if (exercises.length >= skDay.exercises.length + 1) return;
      const fallback = skDay.exercises[j];
      let id = typeof e?.id === "string" ? e.id : typeof e?.exerciseId === "string" ? e.exerciseId : "";
      let replaced = false;
      if (!allowed.has(id) || seen.has(id)) {
        if (!fallback || seen.has(fallback.exerciseId)) return;
        id = fallback.exerciseId;
        replaced = true;
      }
      seen.add(id);
      const ex = EXERCISE_BY_ID[id];
      const sets = replaced && fallback
        ? fallback.sets
        : Number.isFinite(e?.sets) ? Math.max(1, Math.min(5, Math.round(e.sets))) : fallback?.sets ?? 2;
      const reps = replaced && fallback
        ? fallback.reps
        : typeof e?.reps === "string" && e.reps.length < 30 ? e.reps : repsFor(p.goal, ex);
      let why = replaced ? "" : typeof e?.why === "string" ? e.why.trim() : "";
      if (!why || why.split(/\s+/).length > 60) why = fallbackWhy(p, ex);
      exercises.push({ exerciseId: id, sets, reps, why });
    });
    if (exercises.length < 2) return skDay;
    return {
      title: typeof aiDay.title === "string" && aiDay.title.length < 60 ? aiDay.title : skDay.title,
      focus: typeof aiDay.focus === "string" && aiDay.focus.length < 80 ? aiDay.focus : skDay.focus,
      estMinutes: skDay.estMinutes,
      exercises,
    };
  });
  return {
    summary: typeof raw.summary === "string" && raw.summary.length < 400 ? raw.summary : skeleton.summary,
    notes: skeleton.notes,
    days,
  };
}
