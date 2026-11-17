"use client";

import { useAction } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import BottomNav from "@/components/BottomNav";

const EXAMPLES = [
  "Man muss jeden Tag trainieren, um Fortschritte zu sehen.",
  "Bauchübungen verbrennen gezielt Bauchfett.",
  "Ohne Muskelkater war das Training umsonst.",
  "Frauen werden durch Krafttraining zu muskulös.",
];

const VERDICT_LABEL: Record<string, string> = {
  stimmt: "✓ Stimmt",
  teilweise: "≈ Stimmt teilweise",
  stimmt_nicht: "✕ Stimmt nicht",
  kein_thema: "Kein Fitness-Thema",
  fehler: "Gerade nicht möglich",
};

export default function MythPage() {
  const check = useAction(api.ai.mythCheck);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ verdict: string; explanation: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (text.trim().length < 5) {
      setError("Bitte füge zuerst einen Tipp ein.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      setResult(await check({ text }));
    } catch (e) {
      console.error(e);
      setResult({ verdict: "fehler", explanation: "Der Check hat gerade nicht geklappt. Bitte versuch es gleich nochmal." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <div className="eyebrow">Mythen-Check</div>
      <h1>Stimmt das wirklich?</h1>
      <p className="muted">Füge einen Tipp aus TikTok, YouTube oder von Freunden ein – dein Coach prüft ihn für dich.</p>

      <textarea
        className="input"
        placeholder="z. B. „Man sollte vor dem Training immer statisch dehnen.“"
        value={text}
        maxLength={1500}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
      />
      {error && <div className="field-error">{error}</div>}
      <div className="chip-row">
        {EXAMPLES.map((ex) => (
          <button key={ex} className="chip" onClick={() => { setText(ex); setResult(null); setError(null); }}>
            {ex}
          </button>
        ))}
      </div>
      <button className="btn" onClick={run} disabled={loading}>
        {loading ? "Wird geprüft …" : "Tipp prüfen"}
      </button>

      {result && (
        <div className="card" style={{ marginTop: 16 }} aria-live="polite">
          <div className={`verdict ${result.verdict}`}>{VERDICT_LABEL[result.verdict] ?? result.verdict}</div>
          <p style={{ margin: 0 }}>{result.explanation}</p>
          {result.verdict !== "fehler" && result.verdict !== "kein_thema" && (
            <p className="tiny" style={{ marginTop: 10, marginBottom: 0 }}>✦ KI-generierte Einschätzung · ersetzt keine ärztliche Beratung</p>
          )}
        </div>
      )}
      <BottomNav />
    </main>
  );
}
