# StartFit – KI-Coach für Fitness-Einsteiger (Prototyp)

Mobile Web-App: 5 Fragen → persönlicher Wochenplan mit „Warum?“ zu jeder Übung → Training abhaken → Fortschritt sehen.

**Stack:** Next.js 15 (Vercel) · Convex (Datenbank + Server-Funktionen) · Claude API (Plan, Begründungen, Mythen-Check)

## Umfang (laut PRD v1)

| Prio | Funktion | Status |
|---|---|---|
| P0 | Onboarding: genau 5 Fragen, nur Antippen, Fehlermeldung direkt am Feld | ✅ |
| P0 | Arzt-Hinweis + DSGVO-Einwilligung vor dem Start | ✅ |
| P0 | Wochenplan passend zu Zeit (±5 Min.), Ort und Alltag; nur kuratierte Übungen (30) | ✅ |
| P0 | „Warum?“ zu jeder Übung (Muskel, Ziel, Alltag) | ✅ |
| P0 | KI-Fehler → Standardplan + „Nochmal versuchen“ | ✅ |
| P0 | Übungsdetail: Schritte, 2 häufige Fehler, Bild-Platzhalter + Video-Link | ✅ |
| P0 | Sätze mit Wdh. und Gewicht abhaken, „Training beenden“ speichert | ✅ |
| P0 | Fortschritt: Einheiten, Gewichtsverlauf pro Übung, Leerzustand | ✅ |
| P1 | Check-in „zu leicht / passt / zu schwer“ → nächstes Training passt sich an + Begründung | ✅ |
| P1 | Profil änderbar → Plan wird neu erstellt, Verlauf bleibt | ✅ |
| P1 | Mythen-Check (stimmt / teilweise / stimmt nicht, Hinweis bei Nicht-Fitness-Themen) | ✅ |
| P1 | Konto | ✅ Registrierung/Login per E-Mail + Passwort (statt E-Mail-Link), mit Name, Alter, Geschlecht |
| – | Löschen auf Knopfdruck, KI-Kennzeichnung, API-Key nur serverseitig | ✅ |
| neu | Fitness-Buddy: eigene Figur, Energie sinkt ohne Training, Ausrüstung pro Level | ✅ |
| neu | XP & Level (Training, Sätze, Check-in, Wochenziel), Wochen-Serie | ✅ |
| neu | Freunde: Opt-in „In der Nähe“ (PLZ-Bereich), Freundes-Code, Wochen-Rangliste, Anstupsen | ✅ |
| neu | Onboarding: 6 Fragen, „trainiere bereits aktiv“, 1–7 Tage, 20 Min. bis 3 Std. (Schieberegler) | ✅ |
| neu | Plan-Art: Ganzkörper, 2er-, 3er- oder 4er-Split (mit Empfehlung nach Tagen) | ✅ |

## Wie die KI eingebunden ist

1. `convex/planLogic.ts` baut regelbasiert ein Gerüst (Tage, Dauer, Volumen, Mobilität bei Sitzjob, weniger Volumen bei schwerer Arbeit).
2. `convex/ai.ts` lässt Claude das Gerüst personalisieren und jede Übung begründen – nur mit IDs aus `convex/exercises.ts`.
3. Die Antwort wird validiert; unbekannte Übungen werden ersetzt. Bei Fehler/Timeout (14 s) wird der Standardplan gespeichert.

## Setup

### 1. Convex
1. Auf [dashboard.convex.dev](https://dashboard.convex.dev) ein Projekt anlegen (mit GitHub einloggen).
2. **Settings → Environment Variables (Production):** `ANTHROPIC_API_KEY` = dein Claude-API-Key. Optional `ANTHROPIC_MODEL` (Standard: `claude-haiku-5-5`).
3. **Settings → Deploy Keys:** „Generate Production Deploy Key“ kopieren.

### 2. Vercel
1. Projekt aus diesem GitHub-Repo importieren.
2. Environment Variable `CONVEX_DEPLOY_KEY` = Deploy Key aus Schritt 1.3 (Production).
3. Build Command kommt aus `vercel.json`: `npx convex deploy --cmd 'npm run build'` – deployt erst das Backend, setzt `NEXT_PUBLIC_CONVEX_URL` und baut dann das Frontend.

### Lokal entwickeln
```bash
npm install
npx convex dev      # legt .env.local mit NEXT_PUBLIC_CONVEX_URL an
npm run dev
```

## Struktur
```
app/                 Seiten (/, /onboarding, /plan, /uebung/[id], /training/[day], /fortschritt, /mythen, /profil)
components/          Onboarding, Navigation, Convex-Provider
convex/              Schema, Queries/Mutations, KI-Actions, kuratierte Übungsliste, Plan-Logik
lib/                 Geräte-ID, Progressionslogik
convex/gamification  XP, Level, Energie/Laune des Buddys
convex/social        Buddy, Freunde, Rangliste, Anstupsen (+ Demo-Profile)
convex/auth          Registrierung, Login, Abmelden (PBKDF2-Passwort-Hash in convex/crypto.ts)
convex/session       Sitzungs-Token → Konto; alle Datenfunktionen prüfen das serverseitig
```
