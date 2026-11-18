"use client";

import Link from "next/link";
import BuddyAvatar from "@/components/BuddyAvatar";

// Öffentliche Startseite. Angemeldete Nutzer leitet der AuthGate direkt weiter.
export default function Home() {
  return (
    <main className="shell no-nav">
      <div className="hero">
        <div className="eyebrow" style={{ color: "#9fb3aa" }}>StartFit · KI-Coach</div>
        <h1>Schluss mit dem Tipp-Chaos.</h1>
        <p className="muted" style={{ margin: 0 }}>
          Dein persönlicher Trainingsplan in unter 3 Minuten – und zu jeder Übung erfährst du, warum sie für dich drin ist.
        </p>
      </div>

      <div className="card">
        <ul className="bullets">
          <li>
            <span className="ico">1</span>
            <div>
              <strong>Ein paar kurze Fragen</strong>
              <div className="muted small">Ziel, Erfahrung, Zeit, Ort, Alltag und Plan-Art.</div>
            </div>
          </li>
          <li>
            <span className="ico">2</span>
            <div>
              <strong>Plan mit Begründung</strong>
              <div className="muted small">Ganzkörper oder Split – jede Übung erklärt.</div>
            </div>
          </li>
          <li>
            <span className="ico">3</span>
            <div>
              <strong>Mit Buddy und Freunden dranbleiben</strong>
              <div className="muted small">XP sammeln, Level aufsteigen, gegenseitig anstupsen.</div>
            </div>
          </li>
        </ul>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
          <BuddyAvatar mood="top" level={3} size={110} />
        </div>
      </div>

      <div className="stack">
        <Link href="/login?modus=registrieren" className="btn">Konto erstellen</Link>
        <Link href="/login" className="btn ghost">Ich habe schon ein Konto</Link>
      </div>
      <p className="footer-note">Ersetzt keine ärztliche Beratung</p>
    </main>
  );
}
