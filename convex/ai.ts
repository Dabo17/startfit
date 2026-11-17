// KI-Funktionen (Plan, Begründungen, Mythen-Check).
// Der API-Schlüssel liegt nur serverseitig als Convex-Umgebungsvariable ANTHROPIC_API_KEY.
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { exercisesForLocation, Location } from "./exercises";
import {
  LABELS,
  ProfileInput,
  buildStandardPlan,
  validateAiPlan,
} from "./planLogic";

const API_URL = "https://api.anthropic.com/v1/messages";

async function callClaude(system: string, user: string, maxTokens: number, timeoutMs: number) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("NO_KEY");
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
  const request = (async () => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data: any = await res.json();
    return (data.content ?? [])
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("") as string;
  })();
  let timer: any;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs);
  });
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function extractJson(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Keine JSON-Antwort");
  return JSON.parse(text.slice(start, end + 1));
}

function toProfileInput(p: any): ProfileInput {
  return {
    goal: p.goal,
    experience: p.experience,
    daysPerWeek: p.daysPerWeek,
    minutes: p.minutes,
    location: p.location,
    work: p.work,
    trainingTime: p.trainingTime,
  };
}

const PLAN_SYSTEM = `Du bist StartFit, ein freundlicher KI-Fitnesscoach für absolute Einsteiger.
Regeln:
- Verwende AUSSCHLIESSLICH Übungen aus der mitgelieferten Liste (Feld "id"). Erfinde keine Übungen.
- Behalte die Anzahl der Trainingstage exakt bei und die Anzahl Übungen pro Tag ungefähr (±1).
- Schreibe für jede Übung ein "why" auf Deutsch, du-Form, max. 45 Wörter, ohne Fachjargon:
  welcher Muskel trainiert wird, wie sie dem Ziel der Person hilft und – wo passend – der Bezug zum Alltag (z. B. "gleicht langes Sitzen aus").
- Keine medizinischen Versprechen, keine Heilversprechen.
- Antworte NUR mit JSON in diesem Format:
{"summary": "1-2 Sätze", "days": [{"title": "...", "focus": "...", "exercises": [{"id": "...", "sets": 3, "reps": "10–12 Wdh.", "why": "..."}]}]}`;

export const generatePlan = action({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }): Promise<{ source: string; aiError: string | null }> => {
    const profileDoc = await ctx.runQuery(internal.profiles.getInternal, { deviceId });
    if (!profileDoc) throw new Error("Kein Profil gefunden");
    const p = toProfileInput(profileDoc);
    const skeleton = buildStandardPlan(p);

    let plan = skeleton;
    let source = "standard";
    let aiError: string | null = null;

    try {
      const list = exercisesForLocation(p.location as Location).map((e) => ({
        id: e.id,
        name: e.name,
        muskeln: e.muscles,
        kategorie: e.category,
      }));
      const user = `Profil der Person:
- Ziel: ${LABELS.goal[p.goal]}
- Erfahrung: ${LABELS.experience[p.experience]}
- Zeit: ${p.daysPerWeek} Tage pro Woche, je ${p.minutes} Minuten
- Trainingsort: ${LABELS.location[p.location]}
- Arbeit: ${LABELS.work[p.work]}
- Bevorzugte Trainingszeit: ${LABELS.trainingTime[p.trainingTime]}

Erlaubte Übungen (nur diese!):
${JSON.stringify(list)}

Vorgeschlagenes Gerüst (Umfang passt bereits zu Zeit und Alltag – nur sinnvoll anpassen, Sätze nicht erhöhen):
${JSON.stringify(
  skeleton.days.map((d) => ({
    title: d.title,
    focus: d.focus,
    exercises: d.exercises.map((e) => ({ id: e.exerciseId, sets: e.sets, reps: e.reps })),
  })),
)}

Erstelle daraus den persönlichen Wochenplan mit Begründungen.`;
      const text = await callClaude(PLAN_SYSTEM, user, 3000, 14000);
      const validated = validateAiPlan(extractJson(text), skeleton, p);
      if (validated) {
        plan = validated;
        source = "ai";
      } else {
        aiError = "Die KI-Antwort war unvollständig.";
      }
    } catch (e: any) {
      aiError =
        e?.message === "NO_KEY"
          ? "KI ist noch nicht konfiguriert."
          : e?.message === "TIMEOUT"
            ? "Die KI hat zu lange gebraucht."
            : "Die KI war nicht erreichbar.";
      console.error("generatePlan AI error:", e?.message ?? e);
    }

    await ctx.runMutation(internal.plans.savePlan, {
      deviceId,
      source,
      summary: plan.summary,
      notes: plan.notes,
      days: plan.days,
    });
    return { source, aiError };
  },
});

const MYTH_SYSTEM = `Du bist StartFit, ein sachlicher Fitness-Faktenchecker für Einsteiger.
Prüfe den Tipp aus Social Media nach aktuellem sportwissenschaftlichem Konsens.
- Antworte auf Deutsch, du-Form, einfach und ohne Fachjargon, Begründung max. 80 Wörter.
- Wenn der Text nichts mit Fitness, Training, Bewegung oder Regeneration zu tun hat, setze verdict auf "kein_thema".
- Keine medizinischen Diagnosen; bei Schmerzen oder Vorerkrankungen auf ärztliche Abklärung verweisen.
- Antworte NUR mit JSON: {"verdict": "stimmt" | "teilweise" | "stimmt_nicht" | "kein_thema", "explanation": "..."}`;

export const mythCheck = action({
  args: { text: v.string() },
  handler: async (_ctx, { text }): Promise<{ verdict: string; explanation: string }> => {
    const input = text.trim().slice(0, 1500);
    if (input.length < 5) {
      return { verdict: "kein_thema", explanation: "Bitte füge einen Tipp ein, den du prüfen möchtest." };
    }
    try {
      const out = await callClaude(MYTH_SYSTEM, `Tipp: """${input}"""`, 600, 14000);
      const json = extractJson(out);
      const verdicts = ["stimmt", "teilweise", "stimmt_nicht", "kein_thema"];
      const verdict = verdicts.includes(json.verdict) ? json.verdict : "teilweise";
      const explanation =
        verdict === "kein_thema"
          ? "Das scheint kein Fitness-Thema zu sein. Füge gern einen Trainingstipp aus TikTok, YouTube oder von Freunden ein – den prüfe ich für dich."
          : String(json.explanation ?? "").split(/\s+/).slice(0, 100).join(" ");
      return { verdict, explanation };
    } catch (e: any) {
      console.error("mythCheck error:", e?.message ?? e);
      return {
        verdict: "fehler",
        explanation:
          e?.message === "NO_KEY"
            ? "Der Mythen-Check braucht eine KI-Verbindung, die noch nicht eingerichtet ist."
            : "Der Check hat gerade nicht geklappt. Bitte versuch es gleich nochmal.",
      };
    }
  },
});
