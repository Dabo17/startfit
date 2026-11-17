// Buddy-Zustand, XP und Level – reines TypeScript, läuft in Convex und im Browser.

export type WorkoutLike = {
  completedAt: number;
  feedback?: string;
  entries: { sets: { done: boolean }[] }[];
};

export type Mood = "start" | "top" | "gut" | "muede" | "traurig";

export type Stats = {
  totalXp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNext: number;
  weeklyXp: number;
  weekCount: number;
  weekGoal: number;
  weekStreak: number;
  totalWorkouts: number;
  lastWorkoutAt: number | null;
  energy: number; // 0–100
  mood: Mood;
};

const DAY = 864e5;

export const LEVEL_TITLES = [
  "Neuling",
  "Starter",
  "Dranbleiber",
  "Routinier",
  "Kraftpaket",
  "Vorbild",
  "Legende",
];

/** Gesamt-XP, die man für Level L braucht (Level 1 = 0, 2 = 200, 3 = 500, 4 = 900 …). */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * (level + 2);
}

export function levelFromXp(xp: number): number {
  let l = 1;
  while (xpForLevel(l + 1) <= xp) l++;
  return l;
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1];
}

export function doneSetsOf(w: WorkoutLike): number {
  return w.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
}

/** XP für ein einzelnes Training: Basis + pro Satz + Check-in. */
export function workoutXp(w: WorkoutLike): number {
  return Math.min(150, 50 + 5 * doneSetsOf(w)) + (w.feedback ? 10 : 0);
}

export const WEEK_GOAL_BONUS = 100;

/** Montag 00:00 (lokal bzw. UTC auf dem Server) der Woche von t. */
export function weekStart(t: number): number {
  const d = new Date(t);
  const day = (d.getDay() + 6) % 7; // Mo = 0
  d.setHours(0, 0, 0, 0);
  return d.getTime() - day * DAY;
}

export function computeStats(workouts: WorkoutLike[], daysPerWeek: number, now = Date.now()): Stats {
  const goal = Math.max(1, daysPerWeek || 3);
  const sorted = [...workouts].sort((a, b) => a.completedAt - b.completedAt);

  // Workouts pro Woche gruppieren
  const perWeek = new Map<number, number>();
  for (const w of sorted) {
    const ws = weekStart(w.completedAt);
    perWeek.set(ws, (perWeek.get(ws) ?? 0) + 1);
  }

  let totalXp = sorted.reduce((n, w) => n + workoutXp(w), 0);
  for (const count of perWeek.values()) if (count >= goal) totalXp += WEEK_GOAL_BONUS;

  const thisWeek = weekStart(now);
  const weekCount = perWeek.get(thisWeek) ?? 0;
  const weeklyXp =
    sorted.filter((w) => w.completedAt >= thisWeek).reduce((n, w) => n + workoutXp(w), 0) +
    (weekCount >= goal ? WEEK_GOAL_BONUS : 0);

  // Wochen-Serie: aufeinanderfolgende Wochen mit erreichtem Ziel.
  // Die laufende Woche zählt mit, wenn das Ziel schon erreicht ist, bricht die Serie aber nicht.
  let weekStreak = 0;
  let cursor = weekCount >= goal ? thisWeek : thisWeek - 7 * DAY;
  while ((perWeek.get(cursor) ?? 0) >= goal) {
    weekStreak++;
    cursor -= 7 * DAY;
  }

  const level = levelFromXp(totalXp);
  const last = sorted.length ? sorted[sorted.length - 1].completedAt : null;

  // Energie: 100 direkt nach dem Training, nach 12 h Puffer sinkt sie über das Dreifache
  // des geplanten Trainingsabstands auf 0.
  let energy = 60;
  let mood: Mood = "start";
  if (last !== null) {
    const interval = 7 / goal; // Tage zwischen Trainings laut Plan
    const days = (now - last) / DAY;
    energy = Math.round(Math.max(0, Math.min(100, 100 - (Math.max(0, days - 0.5) / (interval * 3)) * 100)));
    mood = energy >= 70 ? "top" : energy >= 40 ? "gut" : energy >= 15 ? "muede" : "traurig";
  }

  return {
    totalXp,
    level,
    levelTitle: levelTitle(level),
    xpIntoLevel: totalXp - xpForLevel(level),
    xpForNext: xpForLevel(level + 1) - xpForLevel(level),
    weeklyXp,
    weekCount,
    weekGoal: goal,
    weekStreak,
    totalWorkouts: sorted.length,
    lastWorkoutAt: last,
    energy,
    mood,
  };
}

export function moodText(mood: Mood, name: string): string {
  switch (mood) {
    case "start":
      return `${name} freut sich auf euer erstes gemeinsames Training!`;
    case "top":
      return `${name} ist topfit und voller Energie – weiter so!`;
    case "gut":
      return `${name} geht's gut. Das nächste Training hält die Energie oben.`;
    case "muede":
      return `${name} wird langsam müde und vermisst das Training mit dir.`;
    case "traurig":
      return `${name} ist ganz schlapp. Schon ein kurzes Training bringt neue Energie!`;
  }
}
