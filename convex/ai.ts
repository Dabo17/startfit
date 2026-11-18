// KI-Funktionen (Plan, Begründungen, Mythen-Check).
// Der API-Schlüssel liegt nur serverseitig als Convex-Umgebungsvariable ANTHROPIC_API_KEY.
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { exercisesForLocation, Location } from "./exercises";
import {
  LABELS,
  ProfileInput,
  recommendedSplit,
  buildStandardPlan,
  validateAiPlan,
} from "./planLogic";

// Unterstützt Claude (ANTHROPIC_API_KEY) und OpenAI (OPENAI_API_KEY).
// Der Anbieter wird am Schlüssel erkannt – auch wenn er in der "falschen" Variable steht.
type Provider = { kind: "anthropic" | "openai"; key: string };

function provider(): Provider | null {
  const keys = [process.env.OPENAI_API_KEY, process.env.ANTHROPIC_API_KEY]
    .map((k) => (k ?? "").trim())
    .filter((k) => k.length > 30);
  const anthropic = keys.find((k) => k.startsWith("sk-ant-"));
  if (anthropic) return { kind: "anthropic", key: anthropic };
  const openai = keys.find((k) => k.startsWith("sk-"));
  if (openai) return { kind: "openai", key: openai };
  return null;
}

/** Ohne (vollständigen) Schlüssel läuft die App im Basis-Modus ohne KI. */
function hasKey(): boolean {
  return provider() !== null;
}

// Basis-Modus: hinterlegte Antworten für häufige Mythen (ohne KI).
const KNOWN_MYTHS: { keys: RegExp; verdict: string; explanation: string }[] = [
  {
    keys: /jeden tag|täglich trainieren|jeden tag trainieren/i,
    verdict: "stimmt_nicht",
    explanation:
      "Muskeln wachsen in der Pause, nicht während des Trainings. Für Einsteiger reichen 2–4 Einheiten pro Woche mit mindestens einem Ruhetag zwischen Krafteinheiten für dieselben Muskeln. Wer jeden Tag hart trainiert, erholt sich schlechter und riskiert Überlastung.",
  },
  {
    keys: /bauchfett|bauch.*(fett|weg)|gezielt.*fett|fett.*gezielt|sit-?ups?.*fett|crunches?.*fett/i,
    verdict: "stimmt_nicht",
    explanation:
      "Gezielt an einer Stelle Fett verbrennen geht nicht. Der Körper baut Fett überall nach seinem eigenen Muster ab. Bauchübungen stärken die Muskeln darunter – sichtbar wird der Bauch erst, wenn der gesamte Körperfettanteil sinkt, z. B. durch Ernährung und Training des ganzen Körpers.",
  },
  {
    keys: /muskelkater/i,
    verdict: "stimmt_nicht",
    explanation:
      "Muskelkater zeigt nur, dass eine Belastung ungewohnt war – nicht, dass das Training gut war. Mit der Zeit gewöhnt sich dein Körper daran und der Muskelkater wird weniger, obwohl du weiter Fortschritte machst. Besser messen: Schaffst du mehr Gewicht oder Wiederholungen?",
  },
  {
    keys: /frauen.*(muskulös|massig|bullig|zu viele muskeln)|(muskulös|massig|bullig).*frauen/i,
    verdict: "stimmt_nicht",
    explanation:
      "Großer Muskelaufbau braucht jahrelanges, gezieltes Training, viel Essen und hohe Testosteronwerte. Frauen haben deutlich weniger Testosteron. Krafttraining macht deshalb vor allem straffer, stärker und stabiler – nicht ungewollt massig.",
  },
  {
    keys: /dehnen|stretch/i,
    verdict: "teilweise",
    explanation:
      "Langes statisches Dehnen direkt vor dem Krafttraining kann die Kraft kurzfristig etwas senken. Besser zum Aufwärmen: lockere Bewegung und dynamische Mobilitätsübungen, wie sie in deinem Plan stehen. Statisches Dehnen passt gut nach dem Training oder an Ruhetagen.",
  },
  {
    keys: /protein|eiweiß|shake/i,
    verdict: "teilweise",
    explanation:
      "Genug Eiweiß hilft beim Muskelaufbau – ein Shake ist aber kein Muss. Für die meisten reicht eiweißreiches Essen wie Quark, Eier, Hülsenfrüchte, Fisch oder Fleisch. Ein Shake ist nur eine bequeme Ergänzung, wenn du es über Mahlzeiten nicht schaffst.",
  },
  {
    keys: /schwitz/i,
    verdict: "stimmt_nicht",
    explanation:
      "Wie stark du schwitzt, hängt vor allem von Temperatur, Veranlagung und Kleidung ab – nicht davon, wie effektiv dein Training war. Was du dabei auf der Waage verlierst, ist nur Wasser und nach dem Trinken wieder da.",
  },
  {
    keys: /cardio.*(muskel|abbau)|ausdauer.*muskel.*(weg|abbau)/i,
    verdict: "teilweise",
    explanation:
      "Moderates Ausdauertraining baut keine Muskeln ab und ist gut für Herz und Erholung. Nur sehr viel Ausdauertraining bei zu wenig Essen kann den Muskelaufbau bremsen. Für Einsteiger passen Kraft und etwas Ausdauer gut zusammen.",
  },
];

function knownMyth(text: string) {
  return KNOWN_MYTHS.find((m) => m.keys.test(text)) ?? null;
}

async function requestAnthropic(key: string, system: string, user: string, maxTokens: number) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data: any = await res.json();
  return (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("") as string;
}

async function requestOpenAI(key: string, system: string, user: string, maxTokens: number) {
  const models = process.env.OPENAI_MODEL ? [process.env.OPENAI_MODEL] : ["gpt-4.1-mini", "gpt-4o-mini"];
  let lastError = "";
  for (const model of models) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (res.ok) {
      const data: any = await res.json();
      return (data.choices?.[0]?.message?.content ?? "") as string;
    }
    lastError = `API ${res.status} (${model}): ${(await res.text()).slice(0, 300)}`;
    // Nur bei unbekanntem Modell das nächste probieren
    if (res.status !== 404 && res.status !== 400) break;
  }
  throw new Error(lastError);
}

async function callClaude(system: string, user: string, maxTokens: number, timeoutMs: number) {
  const p = provider();
  if (!p) throw new Error("NO_KEY");
  const request =
    p.kind === "anthropic"
      ? requestAnthropic(p.key, system, user, maxTokens)
      : requestOpenAI(p.key, system, user, maxTokens);
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
    split: p.split ?? undefined,
  };
}

const PLAN_SYSTEM = `Du bist StartFit, ein freundlicher KI-Fitnesscoach für Einsteiger und Wiedereinsteiger.
Regeln:
- Verwende AUSSCHLIESSLICH Übungen aus der mitgelieferten Liste (Feld "id"). Erfinde keine Übungen.
- Behalte die Anzahl der Trainingstage exakt bei und die Anzahl Übungen pro Tag ungefähr (±1).
- Behalte die Plan-Art (Ganzkörper bzw. Split) und die Muskelgruppen pro Tag bei.
- Schreibe für jede Übung ein "why" auf Deutsch, du-Form, max. 45 Wörter, ohne Fachjargon:
  welcher Muskel trainiert wird, wie sie dem Ziel der Person hilft und – wo passend – der Bezug zum Alltag (z. B. "gleicht langes Sitzen aus").
- Keine medizinischen Versprechen, keine Heilversprechen.
- Antworte NUR mit JSON in diesem Format:
{"summary": "1-2 Sätze", "days": [{"title": "...", "focus": "...", "exercises": [{"id": "...", "sets": 3, "reps": "10–12 Wdh.", "why": "..."}]}]}`;

export const generatePlan = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<{ source: string; aiError: string | null; detail?: string | null; ms?: number }> => {
    const deviceId: string | null = await ctx.runQuery(internal.profiles.ownerInternal, { token });
    if (!deviceId) throw new Error("NICHT_ANGEMELDET");
    const profileDoc = await ctx.runQuery(internal.profiles.getInternal, { deviceId });
    if (!profileDoc) throw new Error("Kein Profil gefunden");
    const account = await ctx.runQuery(internal.profiles.accountInternal, { owner: deviceId });
    const p = { ...toProfileInput(profileDoc), age: account?.age };
    const skeleton = buildStandardPlan(p);

    let plan = skeleton;
    let source = "standard";
    let aiError: string | null = null;
    let detail: string | null = null;
    const started = Date.now();

    if (!hasKey()) {
      await ctx.runMutation(internal.plans.savePlan, {
        deviceId,
        source: "basis",
        summary: plan.summary,
        notes: plan.notes,
        days: plan.days,
      });
      return { source: "basis", aiError: null };
    }

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
- Plan-Art: ${LABELS.split[p.split ?? recommendedSplit(p.daysPerWeek)]}
- Alter: ${p.age ?? "keine Angabe"}
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
      const text = await callClaude(PLAN_SYSTEM, user, 3000, 25000);
      const validated = validateAiPlan(extractJson(text), skeleton, p);
      if (validated) {
        plan = validated;
        source = "ai";
      } else {
        aiError = "Die KI-Antwort war unvollständig.";
        detail = text.slice(0, 300);
      }
    } catch (e: any) {
      aiError =
        e?.message === "NO_KEY"
          ? "KI ist noch nicht konfiguriert."
          : e?.message === "TIMEOUT"
            ? "Die KI hat zu lange gebraucht."
            : "Die KI war nicht erreichbar.";
      detail = String(e?.message ?? e).slice(0, 300);
      console.error("generatePlan AI error:", detail);
      // Ungültiger Schlüssel = wie "keine KI": Basisplan ohne Warnhinweis für Nutzer
      if (/API 401|API 403/.test(detail)) {
        source = "basis";
        aiError = null;
      }
    }
    console.log(`generatePlan: source=${source} provider=${provider()?.kind ?? "none"} ms=${Date.now() - started}`);

    await ctx.runMutation(internal.plans.savePlan, {
      deviceId,
      source,
      summary: plan.summary,
      notes: plan.notes,
      days: plan.days,
    });
    return { source, aiError, detail, ms: Date.now() - started };
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
  handler: async (_ctx, { text }): Promise<{ verdict: string; explanation: string; source?: string }> => {
    const input = text.trim().slice(0, 1500);
    if (input.length < 5) {
      return { verdict: "kein_thema", explanation: "Bitte füge einen Tipp ein, den du prüfen möchtest." };
    }
    if (!hasKey()) {
      const m = knownMyth(input);
      if (m) return { verdict: m.verdict, explanation: m.explanation };
      return {
        verdict: "unbekannt",
        explanation:
          "Zu diesem Tipp habe ich im Prototyp noch keine geprüfte Antwort. Probier einen der Beispiele oder frag z. B. nach Muskelkater, Dehnen, Bauchfett oder Protein.",
      };
    }
    try {
      const out = await callClaude(MYTH_SYSTEM, `Tipp: """${input}"""`, 600, 20000);
      const json = extractJson(out);
      const verdicts = ["stimmt", "teilweise", "stimmt_nicht", "kein_thema"];
      const verdict = verdicts.includes(json.verdict) ? json.verdict : "teilweise";
      const explanation =
        verdict === "kein_thema"
          ? "Das scheint kein Fitness-Thema zu sein. Füge gern einen Trainingstipp aus TikTok, YouTube oder von Freunden ein – den prüfe ich für dich."
          : String(json.explanation ?? "").split(/\s+/).slice(0, 100).join(" ");
      return { verdict, explanation, source: "ai" };
    } catch (e: any) {
      console.error("mythCheck error:", e?.message ?? e);
      const m = knownMyth(input);
      if (m) return { verdict: m.verdict, explanation: m.explanation };
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
