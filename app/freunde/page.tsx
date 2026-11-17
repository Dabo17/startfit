"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import BottomNav from "@/components/BottomNav";
import BuddyAvatar from "@/components/BuddyAvatar";
import { useDeviceId } from "@/lib/device";

function Mini({ p }: { p: any }) {
  return (
    <div className="avatar-mini">
      <BuddyAvatar avatar={p.avatar} mood={p.mood} level={p.level} size={52} animate={false} />
    </div>
  );
}

export default function FriendsPage() {
  const deviceId = useDeviceId();
  const me = useQuery(api.social.me, deviceId ? { deviceId } : "skip");
  const friends = useQuery(api.social.friends, deviceId ? { deviceId } : "skip");
  const nearby = useQuery(api.social.nearby, deviceId ? { deviceId } : "skip");
  const ensureDemo = useMutation(api.social.ensureDemo);
  const saveSocial = useMutation(api.social.saveSocial);
  const requestFriend = useMutation(api.social.requestFriend);
  const addByCode = useMutation(api.social.addByCode);
  const respond = useMutation(api.social.respond);
  const nudge = useMutation(api.social.nudge);

  const [editing, setEditing] = useState(false);
  const [nick, setNick] = useState("");
  const [plz, setPlz] = useState("");
  const [visible, setVisible] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const demoDone = useRef(false);

  useEffect(() => {
    if (demoDone.current) return;
    demoDone.current = true;
    ensureDemo({}).catch(() => {});
  }, [ensureDemo]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (me === undefined) {
    return (
      <main className="shell">
        <div className="center-screen"><div className="spinner" aria-hidden /></div>
        <BottomNav />
      </main>
    );
  }

  if (me === null) {
    return (
      <main className="shell">
        <div className="eyebrow">Freunde</div>
        <h1>Gemeinsam bleibt man dran</h1>
        <p className="muted">Erstelle zuerst deinen Fitness-Buddy – er ist dein Profilbild für Freunde.</p>
        <Link href="/buddy" className="btn">Buddy erstellen</Link>
        <BottomNav />
      </main>
    );
  }

  const profileReady = !!me.nickname && !!me.plzArea;
  const showForm = !profileReady || editing;

  function startEdit() {
    setNick(me!.nickname ?? "");
    setPlz("");
    setVisible(me!.discoverable || !profileReady);
    setFormError(null);
    setEditing(true);
  }

  async function submitProfile() {
    setFormError(null);
    try {
      await saveSocial({ deviceId: deviceId!, nickname: nick, plz, discoverable: visible });
      setEditing(false);
      setToast("Gespeichert");
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      const m = msg.match(/Uncaught Error: (.*?)(\n|$)/);
      setFormError(m ? m[1] : "Bitte prüfe Spitzname und Postleitzahl.");
    }
  }

  async function run(p: Promise<any>) {
    try {
      const res = await p;
      if (res?.message) setToast(res.message);
    } catch (e) {
      console.error(e);
      setToast("Das hat nicht geklappt.");
    }
  }

  return (
    <main className="shell">
      {toast && <div className="toast" role="status">{toast}</div>}
      <div className="eyebrow">Freunde</div>
      <h1>Gemeinsam bleibt man dran</h1>
      <p className="muted">Finde Leute aus deiner Gegend, vergleicht eure Wochen-XP und stupst euch gegenseitig an.</p>

      {/* Eigenes Profil */}
      {showForm ? (
        <div className="card">
          <h2>{profileReady ? "Profil bearbeiten" : "Dein Profil für Freunde"}</h2>
          <label className="field-label" htmlFor="nick" style={{ marginTop: 4 }}>Spitzname</label>
          <input
            id="nick"
            className="text-input"
            maxLength={20}
            placeholder="z. B. Dani"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
          />
          <label className="field-label" htmlFor="plz">Postleitzahl</label>
          <input
            id="plz"
            className="text-input"
            inputMode="numeric"
            maxLength={5}
            placeholder={me.plzArea ? `${me.plzArea}xx (neu eingeben)` : "z. B. 35390"}
            value={plz}
            onChange={(e) => setPlz(e.target.value.replace(/\D/g, ""))}
          />
          <p className="tiny" style={{ marginTop: 6 }}>Gespeichert werden nur die ersten 3 Ziffern – niemand sieht deinen genauen Wohnort.</p>
          <div className="switch-row">
            <div>
              <strong>In der Nähe sichtbar</strong>
              <div className="tiny">Andere aus deiner Region sehen Spitzname, Buddy, Level und PLZ-Bereich.</div>
            </div>
            <button className={`switch ${visible ? "on" : ""}`} role="switch" aria-checked={visible} aria-label="In der Nähe sichtbar" onClick={() => setVisible(!visible)} />
          </div>
          {formError && <div className="field-error">{formError}</div>}
          <div className="stack" style={{ marginTop: 8 }}>
            <button className="btn" onClick={submitProfile}>Speichern</button>
            {profileReady && <button className="btn ghost" onClick={() => setEditing(false)}>Abbrechen</button>}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="row between">
            <div>
              <strong>{me.nickname}</strong>
              <div className="tiny">PLZ {me.plzArea}xx · {me.discoverable ? "in der Nähe sichtbar" : "unsichtbar"}</div>
            </div>
            <button className="btn small ghost" onClick={startEdit}>Bearbeiten</button>
          </div>
          <div className="ex-row row between" style={{ marginTop: 10 }}>
            <div>
              <div className="tiny">Dein Freundes-Code</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.12em" }}>{me.friendCode}</div>
            </div>
            <button
              className="btn small secondary"
              onClick={() => {
                navigator.clipboard?.writeText(me.friendCode).then(() => setToast("Code kopiert")).catch(() => {});
              }}
            >
              Kopieren
            </button>
          </div>
        </div>
      )}

      {/* Anfragen */}
      {friends && friends.incoming.length > 0 && (
        <div className="card">
          <h2>Freundschaftsanfragen</h2>
          {friends.incoming.map((p: any) => (
            <div key={p.requestId} className="person">
              <Mini p={p} />
              <div className="meta">
                <div className="name">{p.nickname}</div>
                <div className="sub">Level {p.level} · {p.levelTitle}</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn small" onClick={() => run(respond({ deviceId: deviceId!, requestId: p.requestId, accept: true }))}>Annehmen</button>
                <button className="btn small ghost" aria-label="Ablehnen" onClick={() => run(respond({ deviceId: deviceId!, requestId: p.requestId, accept: false }))}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rangliste */}
      {friends && (
        <div className="card">
          <div className="row between" style={{ marginBottom: 6 }}>
            <h2 style={{ margin: 0 }}>Wochen-Rangliste</h2>
            <span className="tiny">XP diese Woche</span>
          </div>
          {friends.board.length === 1 && (
            <p className="small muted">Noch keine Freunde – füge unten jemanden hinzu, dann könnt ihr euch hier vergleichen.</p>
          )}
          {friends.board.map((p: any, i: number) => (
            <div key={p.id} className={`person ${p.isMe ? "me" : ""}`}>
              <div className={`rank ${i === 0 ? "gold" : ""}`}>{i === 0 ? "🏆" : i + 1}</div>
              <Mini p={p} />
              <div className="meta">
                <div className="name">
                  {p.isMe ? "Du" : p.nickname}
                  {p.demo && <span className="badge neutral">Demo</span>}
                </div>
                <div className="sub">Lvl {p.level} {p.levelTitle} · {p.weekStreak > 0 ? `🔥 ${p.weekStreak} Wo.` : "noch keine Serie"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800 }}>{p.weeklyXp}</div>
                {!p.isMe && (
                  <button className="link" style={{ background: "none", border: 0, padding: 0 }} onClick={() => run(nudge({ deviceId: deviceId!, targetId: p.id }))}>
                    Anstupsen
                  </button>
                )}
              </div>
            </div>
          ))}
          {friends.outgoing.length > 0 && (
            <p className="tiny" style={{ marginTop: 8, marginBottom: 0 }}>
              Offene Anfragen: {friends.outgoing.map((p: any) => p.nickname).join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Code */}
      <div className="card">
        <h2>Per Code hinzufügen</h2>
        <div className="row">
          <input
            className="text-input"
            placeholder="z. B. K7M2QX"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            aria-label="Freundes-Code"
          />
          <button
            className="btn small"
            style={{ minHeight: 48 }}
            onClick={async () => {
              if (code.trim().length !== 6) return setToast("Der Code hat 6 Zeichen.");
              await run(addByCode({ deviceId: deviceId!, code }));
              setCode("");
            }}
          >
            Hinzufügen
          </button>
        </div>
      </div>

      {/* In der Nähe */}
      <div className="card">
        <h2>In deiner Nähe</h2>
        {!nearby || !nearby.ready ? (
          <p className="small muted" style={{ margin: 0 }}>
            Lege oben Spitzname und Postleitzahl fest und schalte „In der Nähe sichtbar“ ein, um Leute aus deiner Region zu finden.
          </p>
        ) : nearby.people.length === 0 ? (
          <p className="small muted" style={{ margin: 0 }}>Gerade niemand Neues in deiner Region.</p>
        ) : (
          nearby.people.map((p: any) => (
            <div key={p.id} className="person">
              <Mini p={p} />
              <div className="meta">
                <div className="name">
                  {p.nickname}
                  {p.demo && <span className="badge neutral">Demo</span>}
                </div>
                <div className="sub">Lvl {p.level} {p.levelTitle}{p.region ? ` · ${p.region}` : ""}</div>
                {p.info && <div className="sub">{p.info}</div>}
              </div>
              {p.relation === "sent" ? (
                <span className="tiny">Angefragt</span>
              ) : (
                <button className="btn small secondary" onClick={() => run(requestFriend({ deviceId: deviceId!, targetId: p.id }))}>
                  {p.relation === "received" ? "Annehmen" : "+ Freund"}
                </button>
              )}
            </div>
          ))
        )}
        <p className="tiny" style={{ marginTop: 10, marginBottom: 0 }}>
          Profile mit „Demo“ sind Beispielnutzer für den Prototyp.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
