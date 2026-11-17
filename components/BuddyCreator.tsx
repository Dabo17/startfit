"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { getOrCreateDeviceId } from "@/lib/device";
import BuddyAvatar, { Avatar, DEFAULT_AVATAR, HAIR_COLORS, HAIR_STYLES, SHIRTS, SKINS } from "./BuddyAvatar";

export default function BuddyCreator({
  initialName,
  initialAvatar,
  onDone,
  onCancel,
}: {
  initialName?: string;
  initialAvatar?: Avatar;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const save = useMutation(api.social.saveBuddy);
  const [name, setName] = useState(initialName ?? "");
  const [avatar, setAvatar] = useState<Avatar>(initialAvatar ?? DEFAULT_AVATAR);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<Avatar>) => setAvatar((a) => ({ ...a, ...patch }));

  async function submit() {
    if (name.trim().length < 2) {
      setError("Gib deinem Buddy einen Namen (mind. 2 Zeichen).");
      return;
    }
    setSaving(true);
    try {
      await save({ deviceId: getOrCreateDeviceId(), buddyName: name.trim(), avatar });
      onDone?.();
    } catch (e) {
      console.error(e);
      setError("Speichern hat nicht geklappt. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {onCancel && (
        <div className="topbar">
          <button className="back" onClick={onCancel}>← Abbrechen</button>
        </div>
      )}
      <div className="eyebrow">Dein Fitness-Buddy</div>
      <h1>{initialName ? "Aussehen ändern" : "Lern deinen Buddy kennen"}</h1>
      {!initialName && (
        <p className="muted">
          Dein Buddy trainiert mit dir. Trainierst du regelmäßig, ist er voller Energie – lässt du ihn hängen, wird er
          müde. Mit jedem Level bekommt er neue Ausrüstung.
        </p>
      )}

      <div className="buddy-stage">
        <BuddyAvatar avatar={avatar} mood="start" level={1} size={160} />
      </div>

      <div className="card">
        <label className="field-label" htmlFor="buddyname" style={{ marginTop: 0 }}>Name</label>
        <input
          id="buddyname"
          className="text-input"
          placeholder="z. B. Max, Fritzi, Bolt …"
          maxLength={20}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
        />
        {error && <div className="field-error">{error}</div>}

        <span className="field-label">Hautton</span>
        <div className="swatches" role="radiogroup" aria-label="Hautton">
          {SKINS.map((c, i) => (
            <button key={c} role="radio" aria-checked={avatar.skin === i} aria-label={`Hautton ${i + 1}`} className={`swatch ${avatar.skin === i ? "selected" : ""}`} style={{ background: c }} onClick={() => set({ skin: i })} />
          ))}
        </div>

        <span className="field-label">Frisur</span>
        <div className="seg" role="radiogroup" aria-label="Frisur">
          {HAIR_STYLES.map((s, i) => (
            <button key={s} role="radio" aria-checked={avatar.hair === i} className={avatar.hair === i ? "selected" : ""} onClick={() => set({ hair: i })}>{s}</button>
          ))}
        </div>

        <span className="field-label">Haarfarbe</span>
        <div className="swatches" role="radiogroup" aria-label="Haarfarbe">
          {HAIR_COLORS.map((c, i) => (
            <button key={c} role="radio" aria-checked={avatar.hairColor === i} aria-label={`Haarfarbe ${i + 1}`} className={`swatch ${avatar.hairColor === i ? "selected" : ""}`} style={{ background: c }} onClick={() => set({ hairColor: i })} />
          ))}
        </div>

        <span className="field-label">Shirt</span>
        <div className="swatches" role="radiogroup" aria-label="Shirtfarbe">
          {SHIRTS.map((c, i) => (
            <button key={c} role="radio" aria-checked={avatar.shirt === i} aria-label={`Shirtfarbe ${i + 1}`} className={`swatch ${avatar.shirt === i ? "selected" : ""}`} style={{ background: c }} onClick={() => set({ shirt: i })} />
          ))}
        </div>
      </div>

      <button className="btn" onClick={submit} disabled={saving}>
        {saving ? "Wird gespeichert …" : initialName ? "Speichern" : "Los geht's, Buddy!"}
      </button>
    </div>
  );
}
