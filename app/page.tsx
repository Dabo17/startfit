"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useDeviceId } from "@/lib/device";

export default function Home() {
  const deviceId = useDeviceId();
  const router = useRouter();
  const plan = useQuery(api.plans.current, deviceId ? { deviceId } : "skip");

  // Wiederkehrende Nutzer landen direkt beim Plan
  useEffect(() => {
    if (plan) router.replace("/plan");
  }, [plan, router]);

  if (!deviceId || plan === undefined || plan) {
    return (
      <main className="shell no-nav">
        <div className="center-screen">
          <div className="spinner" aria-hidden />
        </div>
      </main>
    );
  }

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
              <strong>5 kurze Fragen</strong>
              <div className="muted small">Ziel, Erfahrung, Zeit, Ort und Alltag – nur antippen.</div>
            </div>
          </li>
          <li>
            <span className="ico">2</span>
            <div>
              <strong>Plan mit Begründung</strong>
              <div className="muted small">Jede Übung erklärt: welcher Muskel, warum für dich.</div>
            </div>
          </li>
          <li>
            <span className="ico">3</span>
            <div>
              <strong>Fortschritt sehen</strong>
              <div className="muted small">Sätze abhaken und deine Entwicklung verfolgen.</div>
            </div>
          </li>
        </ul>
      </div>

      <Link href="/onboarding" className="btn">Los geht&apos;s</Link>
      <p className="footer-note">Kein Konto nötig · Inhalte sind KI-generiert · Ersetzt keine ärztliche Beratung</p>
    </main>
  );
}
