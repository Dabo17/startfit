"use client";

import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { setToken } from "@/lib/session";

const GENDERS = [
  { value: "weiblich", label: "Weiblich" },
  { value: "maennlich", label: "Männlich" },
  { value: "divers", label: "Divers" },
  { value: "keine_angabe", label: "Keine Angabe" },
];

type Mode = "login" | "register";

export default function LoginPage() {
  const signIn = useMutation(api.auth.signIn);
  const signUp = useMutation(api.auth.signUp);

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("modus") === "registrieren") setMode("register");
  }, []);

  function switchMode(m: Mode) {
    setMode(m);
    setErrors({});
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (mode === "register" && name.trim().length < 2) e.name = "Bitte gib deinen Namen ein.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Bitte gib eine gültige E-Mail-Adresse ein.";
    if (mode === "register" && password.length < 8) e.password = "Das Passwort braucht mindestens 8 Zeichen.";
    if (mode === "login" && !password) e.password = "Bitte gib dein Passwort ein.";
    if (mode === "register" && !gender) e.gender = "Bitte wähle eine Option.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const res: any =
        mode === "login"
          ? await signIn({ email, password })
          : await signUp({ email, password, name, age, gender: gender! });
      if (res.ok) {
        setToken(res.token); // AuthGate leitet weiter (Onboarding oder Plan)
        return;
      }
      setErrors({ [res.field ?? "form"]: res.message });
    } catch (e) {
      console.error(e);
      setErrors({ form: "Das hat nicht geklappt. Bitte prüfe deine Verbindung." });
    } finally {
      setBusy(false);
    }
  }

  const ageHint = age < 18 ? "Unter 18: Dein Plan setzt auf Technik statt schwerer Gewichte." : age >= 50 ? "Dein Plan legt besonderen Wert auf Aufwärmen und Technik." : "";

  return (
    <main className="shell no-nav">
      <div className="hero" style={{ paddingBottom: 18 }}>
        <div className="eyebrow" style={{ color: "#9fb3aa" }}>StartFit · KI-Coach</div>
        <h1 style={{ fontSize: 28 }}>{mode === "login" ? "Willkommen zurück!" : "Konto erstellen"}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {mode === "login"
            ? "Melde dich an – dein Plan, dein Buddy und dein Fortschritt warten auf dich."
            : "In 1 Minute startklar. Danach erstellen wir deinen persönlichen Plan."}
        </p>
      </div>

      <div className="seg full" role="tablist" style={{ marginBottom: 14 }}>
        <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "selected" : ""} onClick={() => switchMode("login")}>Anmelden</button>
        <button role="tab" aria-selected={mode === "register"} className={mode === "register" ? "selected" : ""} onClick={() => switchMode("register")}>Registrieren</button>
      </div>

      <form className="card" onSubmit={submit} noValidate>
        {mode === "register" && (
          <>
            <label className="field-label" htmlFor="name" style={{ marginTop: 0 }}>Name</label>
            <input id="name" className="text-input" autoComplete="given-name" maxLength={40} placeholder="z. B. Daniel" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </>
        )}

        <label className="field-label" htmlFor="email" style={mode === "login" ? { marginTop: 0 } : undefined}>E-Mail</label>
        <input id="email" className="text-input" type="email" inputMode="email" autoComplete="email" placeholder="du@beispiel.de" value={email} onChange={(e) => setEmail(e.target.value)} />
        {errors.email && <div className="field-error">{errors.email}</div>}

        <label className="field-label" htmlFor="password">Passwort</label>
        <div style={{ position: "relative" }}>
          <input
            id="password"
            className="text-input"
            type={showPw ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "register" ? "mind. 8 Zeichen" : ""}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ paddingRight: 80 }}
          />
          <button type="button" className="link" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: 14, background: "none", border: 0 }}>
            {showPw ? "Verbergen" : "Anzeigen"}
          </button>
        </div>
        {errors.password && <div className="field-error">{errors.password}</div>}

        {mode === "register" && (
          <>
            <div className="slider-card" style={{ marginTop: 16, marginBottom: 0 }}>
              <div className="slider-head">
                <span className="slider-label">Alter</span>
                <span className="slider-value">{age >= 80 ? "80+" : age} Jahre</span>
              </div>
              <input
                type="range"
                className="range"
                min={14}
                max={80}
                step={1}
                value={age}
                aria-label="Alter"
                style={{ ["--pct" as any]: `${((age - 14) / 66) * 100}%` }}
                onChange={(e) => setAge(parseInt(e.target.value, 10))}
              />
              <div className="slider-ticks" aria-hidden>
                <span>14</span><span>30</span><span>50</span><span>80+</span>
              </div>
              {ageHint && <p className="tiny" style={{ margin: "8px 0 0" }}>{ageHint}</p>}
            </div>
            {errors.age && <div className="field-error">{errors.age}</div>}

            <span className="field-label">Geschlecht</span>
            <div className="options two" role="radiogroup" aria-label="Geschlecht">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  role="radio"
                  aria-checked={gender === g.value}
                  className={`option center ${gender === g.value ? "selected" : ""}`}
                  onClick={() => {
                    setGender(g.value);
                    setErrors((e) => ({ ...e, gender: "" }));
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {errors.gender && <div className="field-error">{errors.gender}</div>}
            <p className="tiny" style={{ marginTop: 10 }}>
              Wir speichern keine Gesundheitsdaten. Alter und Geschlecht nutzen wir nur, um deinen Plan passend zu formulieren.
            </p>
          </>
        )}

        {errors.form && <div className="banner" style={{ marginTop: 12 }}>{errors.form}</div>}
        <button className="btn" type="submit" disabled={busy} style={{ marginTop: 18 }}>
          {busy ? "Einen Moment …" : mode === "login" ? "Anmelden" : "Konto erstellen"}
        </button>
      </form>

      <p className="footer-note">
        {mode === "login" ? (
          <>Noch kein Konto? <button className="link" style={{ background: "none", border: 0 }} onClick={() => switchMode("register")}>Jetzt registrieren</button></>
        ) : (
          <>Schon dabei? <button className="link" style={{ background: "none", border: 0 }} onClick={() => switchMode("login")}>Anmelden</button></>
        )}
      </p>
    </main>
  );
}
