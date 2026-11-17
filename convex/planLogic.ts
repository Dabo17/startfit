// Regelbasierte Plan-Logik: liefert den Standardplan (Fallback) und das Gerüst,
// das die KI personalisiert. Reines TypeScript – läuft in Convex und im Browser.
import {
  EXERCISE_BY_ID,
  Exercise,
  Location,
  Pattern,
  exercisesForLocation,
} from "./exercises";

export type Goal = "muskelaufbau" | "abnehmen" | "ausdauer" | "fitness";
export type Experience = "nie" | "unter6" | "neustart";
export type Work = "sitzend" | "gemischt" | "schwer";
export type TrainingTime = "morgens" | "mittags" | "abends" | "wechselnd";

export type ProfileInput = {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  minutes: number;
  location: Location;
  work: Work;
  trainingTime: TrainingTime;
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
} as const;

const SITTING_MOBILITY = ["hueftbeuger_dehnung", "katze_kuh", "brustwirbel_rotation"];

function setsFor(p: ProfileInput): number {
  let sets = p.experience === "nie" ? 2 : 3;
  if (p.work === "schwer") sets = Math.max(2, sets - 1);
  return sets;
}

export function repsFor(goal: Goal, ex: Exercise): string {
  if (ex.category === "ausdauer") {
    if (ex.equipment === "gym") return "8 Min.";
    return "30 Sek.";
  }
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
  if (ex.category === "mobilitaet")
    return "Als Aufwärmen bereitet sie deinen Körper auf das Training vor.";
  if (ex.category === "ausdauer") {
    if (goal === "abnehmen") return "Für dein Ziel Abnehmen: Hier verbrauchst du besonders viel Energie.";
    if (goal === "ausdauer") return "Direkt für dein Ziel: Herz und Lunge werden leistungsfähiger.";
    return "Bringt deinen Kreislauf in Schwung.";
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

function candidates(location: Location, pattern: Pattern): Exercise[] {
  const list = exercisesForLocation(location).filter((e) => e.pattern === pattern);
  // Im Studio geführte Maschinen bevorzugen (einfacher für Einsteiger)
  const order = { gym: 0, dumbbell: 1, bodyweight: 2 } as const;
  return list.sort((a, b) => order[a.equipment] - order[b.equipment]);
}

function pick(location: Location, pattern: Pattern, variant: number, used: Set<string>): Exercise | null {
  const c = candidates(location, pattern).filter((e) => !used.has(e.id));
  if (c.length === 0) return null;
  return c[variant % c.length];
}

type DayTemplate = { title: string; focus: string; patterns: Pattern[] };

function dayTemplates(days: number): DayTemplate[] {
  const fullA: DayTemplate = {
    title: "Ganzkörper A",
    focus: "Beine, Drücken, Ziehen, Rumpf",
    patterns: ["beine", "druecken", "ziehen", "huefte", "rumpf", "beine", "druecken", "ziehen"],
  };
  const fullB: DayTemplate = {
    title: "Ganzkörper B",
    focus: "Hüfte, Ziehen, Drücken, Rumpf",
    patterns: ["huefte", "ziehen", "druecken", "beine", "rumpf", "ziehen", "huefte", "druecken"],
  };
  const upper: DayTemplate = {
    title: "Oberkörper",
    focus: "Brust, Rücken, Schultern, Arme",
    patterns: ["druecken", "ziehen", "druecken", "ziehen", "rumpf", "ziehen", "druecken"],
  };
  const lower: DayTemplate = {
    title: "Unterkörper & Rumpf",
    focus: "Beine, Po, Bauch",
    patterns: ["beine", "huefte", "beine", "huefte", "rumpf", "rumpf", "beine"],
  };
  if (days <= 3) return Array.from({ length: days }, (_, i) => (i % 2 === 0 ? fullA : fullB));
  if (days === 4) return [upper, lower, upper, lower];
  return [upper, lower, fullA, upper, lower];
}

const WEEKDAY_SLOTS: Record<number, string[]> = {
  2: ["Montag", "Donnerstag"],
  3: ["Montag", "Mittwoch", "Freitag"],
  4: ["Montag", "Dienstag", "Donnerstag", "Freitag"],
  5: ["Montag", "Dienstag", "Mittwoch", "Freitag", "Samstag"],
};

export function weekdayLabel(days: number, index: number): string {
  return WEEKDAY_SLOTS[days]?.[index] ?? `Tag ${index + 1}`;
}

/** Erstellt den regelbasierten Standardplan. */
export function buildStandardPlan(p: ProfileInput): PlanData {
  const sets = setsFor(p);
  const templates = dayTemplates(p.daysPerWeek);
  const wantsCardio = p.goal === "abnehmen" || p.goal === "ausdauer";
  const cardioMin = wantsCardio ? (p.minutes >= 45 ? 10 : 5) : 0;
  const warmupMin = p.trainingTime === "morgens" || p.work === "sitzend" ? 6 : 4;
  const perExercise = sets * 2; // ca. 2 Min. pro Satz inkl. Pause
  let strengthCount = Math.floor((p.minutes - warmupMin - cardioMin) / perExercise);
  if (p.work === "schwer") strengthCount -= 1; // weniger Volumen bei körperlich schwerer Arbeit
  strengthCount = Math.max(2, Math.min(7, strengthCount));

  const days: PlanDay[] = templates.map((t, dayIndex) => {
    const used = new Set<string>();
    const exercises: PlanExercise[] = [];

    // 1) Mobilität / Aufwärmen
    const mobilityCount = p.work === "sitzend" || p.trainingTime === "morgens" ? 2 : 1;
    const mobilityPool =
      p.work === "sitzend"
        ? SITTING_MOBILITY
        : ["weltbeste_dehnung", "katze_kuh", "brustwirbel_rotation", "hueftbeuger_dehnung"];
    for (let i = 0; i < mobilityCount; i++) {
      const id = mobilityPool[(dayIndex + i) % mobilityPool.length];
      if (used.has(id)) continue;
      used.add(id);
      const ex = EXERCISE_BY_ID[id];
      exercises.push({ exerciseId: id, sets: 1, reps: repsFor(p.goal, ex), why: fallbackWhy(p, ex) });
    }

    // 2) Kraftübungen
    let added = 0;
    for (const pattern of t.patterns) {
      if (added >= strengthCount) break;
      const ex = pick(p.location, pattern, dayIndex + added, used);
      if (!ex) continue;
      used.add(ex.id);
      exercises.push({ exerciseId: ex.id, sets, reps: repsFor(p.goal, ex), why: fallbackWhy(p, ex) });
      added++;
    }

    // 3) Ausdauer-Finisher
    if (wantsCardio) {
      const ex = pick(p.location, "ausdauer", dayIndex, used);
      if (ex) {
        const isMachine = ex.equipment === "gym";
        exercises.push({
          exerciseId: ex.id,
          sets: isMachine ? 1 : cardioMin >= 10 ? 4 : 3,
          reps: isMachine ? `${cardioMin} Min.` : "30 Sek.",
          why: fallbackWhy(p, ex),
        });
      }
    }

    const est = warmupMin + added * perExercise + cardioMin;
    return {
      title: `${weekdayLabel(p.daysPerWeek, dayIndex)} · ${t.title}`,
      focus: t.focus,
      estMinutes: Math.min(p.minutes + 5, Math.max(p.minutes - 5, est)),
      exercises,
    };
  });

  return {
    summary: `Dein Plan: ${p.daysPerWeek}× pro Woche je ca. ${p.minutes} Minuten, ausgerichtet auf ${LABELS.goal[p.goal]} (${LABELS.location[p.location]}).`,
    notes: buildNotes(p),
    days,
  };
}

export function buildNotes(p: ProfileInput): string[] {
  const notes: string[] = [];
  if (p.work === "schwer")
    notes.push("Weil deine Arbeit körperlich schwer ist, hat dein Plan weniger Sätze und mehr Ruhetage zur Regeneration.");
  if (p.work === "sitzend")
    notes.push("Weil du viel sitzt, starten deine Einheiten mit Mobilitätsübungen für Rücken und Hüfte.");
  if (p.trainingTime === "morgens")
    notes.push("Morgens ist der Körper noch steif – nimm dir das Aufwärmen deshalb besonders zu Herzen.");
  if (p.trainingTime === "abends")
    notes.push("Abends: Plane das Training mind. 2 Stunden vor dem Schlafen ein, damit du gut zur Ruhe kommst.");
  if (p.trainingTime === "wechselnd")
    notes.push("Bei wechselnden Zeiten: Die Wochentage sind nur ein Vorschlag – wichtig ist ein Ruhetag zwischen den Einheiten.");
  if (p.experience === "nie")
    notes.push("Als Einsteiger startest du mit wenigen Sätzen und leichtem Gewicht. Saubere Technik geht vor.");
  if (p.experience === "neustart")
    notes.push("Nach einer Pause: Starte bewusst leichter als früher – du wirst schnell wieder reinkommen.");
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
