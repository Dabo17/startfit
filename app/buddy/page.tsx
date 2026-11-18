"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { computeStats, moodText, WEEK_GOAL_BONUS } from "@/convex/gamification";
import BottomNav from "@/components/BottomNav";
import BuddyAvatar from "@/components/BuddyAvatar";
import BuddyCreator from "@/components/BuddyCreator";
import { useSessionToken } from "@/lib/session";

const REWARDS = [
  { level: 2, label: "Stirnband" },
  { level: 3, label: "Schweißbänder" },
  { level: 4, label: "Neon-Sneaker" },
  { level: 5, label: "Eigene Hantel" },
  { level: 6, label: "Goldmedaille" },
];

export default function BuddyPage() {
  const token = useSessionToken();
  const me = useQuery(api.social.me, token ? { token } : "skip");
  const workouts = useQuery(api.workouts.list, token ? { token } : "skip");
  const profile = useQuery(api.profiles.get, token ? { token } : "skip");
  const markSeen = useMutation(api.social.markNudgesSeen);
  const [editing, setEditing] = useState(false);

  if (me === undefined || workouts === undefined || profile === undefined) {
    return (
      <main className="shell">
        <div className="center-screen"><div className="spinner" aria-hidden /></div>
        <BottomNav />
      </main>
    );
  }

  if (me === null || editing) {
    return (
      <main className="shell">
        <BuddyCreator
          initialName={me?.buddyName}
          initialAvatar={me?.avatar}
          onDone={() => setEditing(false)}
          onCancel={me ? () => setEditing(false) : undefined}
        />
        <BottomNav />
      </main>
    );
  }

  const s = computeStats(workouts, profile?.daysPerWeek ?? 3);
  const energyColor = s.energy >= 70 ? "var(--accent)" : s.energy >= 40 ? "#E0A100" : "#D9534F";
  const nextReward = REWARDS.find((r) => r.level > s.level);

  return (
    <main className="shell">
      <div className="row between">
        <div className="eyebrow">Dein Buddy</div>
        <span className="level-pill"><span className="num">{s.level}</span>{s.levelTitle}</span>
      </div>
      <h1>{me.buddyName}</h1>

      {me.nudges.length > 0 && (
        <div className="banner info row between">
          <span>
            💪 {me.nudges.map((n: any) => n.from).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(", ")}{" "}
            {me.nudges.length === 1 ? "hat" : "haben"} dich angestupst!
          </span>
          <button className="btn small secondary" onClick={() => token && markSeen({ token })}>Danke!</button>
        </div>
      )}

      <div className="buddy-stage">
        <div className="speech">{moodText(s.mood, me.buddyName)}</div>
        <div>
          <BuddyAvatar avatar={me.avatar} mood={s.mood} level={s.level} size={180} />
        </div>
        <div className="meter">
          <div className="meter-head">
            <span>⚡ Energie</span>
            <span>{s.energy}%</span>
          </div>
          <div className="meter-track"><div className="meter-fill" style={{ width: `${s.energy}%`, background: energyColor }} /></div>
        </div>
        <div className="meter">
          <div className="meter-head">
            <span>⭐ Level {s.level} → {s.level + 1}</span>
            <span>{s.xpIntoLevel} / {s.xpForNext} XP</span>
          </div>
          <div className="meter-track"><div className="meter-fill" style={{ width: `${Math.min(100, (s.xpIntoLevel / s.xpForNext) * 100)}%`, background: "#F2C14E" }} /></div>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><div className="val">{s.weekCount}/{s.weekGoal}</div><div className="lbl">Wochenziel</div></div>
        <div className="stat"><div className="val">{s.weekStreak}</div><div className="lbl">Wochen-Serie</div></div>
        <div className="stat"><div className="val">{s.totalXp}</div><div className="lbl">XP gesamt</div></div>
      </div>

      <Link href="/plan" className="btn">Zusammen trainieren</Link>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Ausrüstung freischalten</h2>
        {REWARDS.map((r) => (
          <div key={r.level} className="ex-row row between">
            <span style={{ opacity: s.level >= r.level ? 1 : 0.5 }}>{s.level >= r.level ? "✅" : "🔒"} {r.label}</span>
            <span className="tiny">Level {r.level}</span>
          </div>
        ))}
        {nextReward && (
          <p className="tiny" style={{ marginTop: 8, marginBottom: 0 }}>
            Noch {Math.max(0, s.xpForNext - s.xpIntoLevel)} XP bis Level {s.level + 1}
            {nextReward.level === s.level + 1 ? ` – dann gibt's: ${nextReward.label}` : ""}.
          </p>
        )}
      </div>

      <div className="card flat">
        <h3 style={{ marginBottom: 6 }}>So sammelst du XP</h3>
        <p className="small muted" style={{ margin: 0 }}>
          Training abschließen: 50 XP + 5 XP pro Satz · Check-in nach dem Training: +10 XP · Wochenziel ({s.weekGoal}×)
          erreicht: +{WEEK_GOAL_BONUS} XP. Dein Buddy verliert Energie, wenn du länger nicht trainierst, als dein Plan
          vorsieht.
        </p>
      </div>

      <button className="btn ghost" onClick={() => setEditing(true)}>Aussehen ändern</button>
      <BottomNav />
    </main>
  );
}
