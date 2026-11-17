import { EXERCISE_BY_ID } from "@/convex/exercises";

export function unitOf(reps: string): "Min" | "Sek" | "Wdh" {
  if (/min/i.test(reps)) return "Min";
  if (/sek/i.test(reps)) return "Sek";
  return "Wdh";
}

export function firstNumber(reps: string): number {
  const m = reps.match(/\d+/);
  return m ? parseInt(m[0], 10) : 10;
}

export type Suggestion = { weight?: number; reps?: number; reason?: string };

const fmt = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 1 });

/** P1: Plan wächst mit – Vorschlag aufgrund des letzten Trainings und des Check-ins. */
export function suggestionFor(exerciseId: string, workouts: any[]): Suggestion {
  const ex = EXERCISE_BY_ID[exerciseId];
  if (!ex) return {};
  for (let i = workouts.length - 1; i >= 0; i--) {
    const w = workouts[i];
    const entry = w.entries.find((e: any) => e.exerciseId === exerciseId);
    if (!entry) continue;
    const done = entry.sets.filter((s: any) => s.done);
    if (done.length === 0) continue;
    const lastWeight = Math.max(0, ...done.map((s: any) => s.weight ?? 0));
    const lastReps = Math.max(0, ...done.map((s: any) => s.reps ?? 0));
    const fb = w.feedback as string | undefined;

    if (ex.usesWeight && lastWeight > 0) {
      if (fb === "zu_leicht")
        return { weight: lastWeight + 2.5, reason: `Letztes Mal war es dir zu leicht – heute ${fmt(lastWeight + 2.5)} kg (+2,5 kg).` };
      if (fb === "zu_schwer") {
        const wgt = Math.max(0, lastWeight - 2.5);
        return { weight: wgt, reason: `Letztes Mal war es zu schwer – heute ${fmt(wgt)} kg, damit die Technik sauber bleibt.` };
      }
      return { weight: lastWeight, reason: `Letztes Mal: ${fmt(lastWeight)} kg. Gehen alle Wiederholungen locker, steigere beim nächsten Mal.` };
    }
    if (lastReps > 0) {
      if (fb === "zu_leicht") return { reps: lastReps + 2, reason: `Letztes Mal zu leicht – heute 2 mehr (${lastReps + 2}).` };
      if (fb === "zu_schwer") {
        const r = Math.max(1, lastReps - 2);
        return { reps: r, reason: `Letztes Mal zu schwer – heute etwas weniger (${r}).` };
      }
      return { reps: lastReps, reason: `Letztes Mal: ${lastReps}.` };
    }
  }
  return {};
}
