// Der Fitness-Buddy: eine eigene, menschliche Figur. Laune ändert Mimik und Haltung,
// mit steigendem Level bekommt der Buddy Ausrüstung (Stirnband, Schweißbänder, Hantel, Medaille).

export type Avatar = { skin: number; hair: number; hairColor: number; shirt: number };
export type BuddyMood = "start" | "top" | "gut" | "muede" | "traurig";

export const SKINS = ["#F6D7C3", "#E8B896", "#C98E64", "#8D5A3B", "#5C3A26"];
export const HAIR_COLORS = ["#2B1D14", "#6B4226", "#D2A85E", "#B5462E"];
export const SHIRTS = ["#1d6b4f", "#2F6FD6", "#E2572B", "#7A4FD1", "#E0A100"];
export const HAIR_STYLES = ["Kurz", "Zopf", "Dutt", "Locken"];

export const DEFAULT_AVATAR: Avatar = { skin: 1, hair: 0, hairColor: 1, shirt: 0 };

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function Hair({ style, color }: { style: number; color: string }) {
  switch (style) {
    case 1: // Zopf
      return (
        <g fill={color}>
          <path d="M64 76 C62 46 82 36 100 36 C120 36 138 46 136 76 C130 60 118 52 100 52 C84 52 70 60 64 76 Z" />
          <path d="M132 62 C150 70 152 100 140 118 C146 98 140 82 128 74 Z" />
          <circle cx="136" cy="66" r="5" fill={shade(color, -30)} />
        </g>
      );
    case 2: // Dutt
      return (
        <g fill={color}>
          <circle cx="100" cy="34" r="14" />
          <path d="M64 78 C62 50 80 40 100 40 C120 40 138 50 136 78 C128 62 116 54 100 54 C84 54 72 62 64 78 Z" />
        </g>
      );
    case 3: // Locken
      return (
        <g fill={color}>
          {[
            [70, 62], [78, 50], [90, 43], [102, 41], [114, 44], [125, 51], [132, 62], [66, 74], [134, 74],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={11} />
          ))}
        </g>
      );
    default: // Kurz
      return (
        <path
          fill={color}
          d="M64 74 C60 48 80 38 100 38 C122 38 140 48 136 74 C132 64 124 58 112 58 C104 52 92 54 86 58 C76 58 68 64 64 74 Z"
        />
      );
  }
}

export default function BuddyAvatar({
  avatar = DEFAULT_AVATAR,
  mood = "gut",
  level = 1,
  size = 200,
  animate = true,
}: {
  avatar?: Avatar;
  mood?: BuddyMood;
  level?: number;
  size?: number;
  animate?: boolean;
}) {
  const skin = SKINS[avatar.skin] ?? SKINS[1];
  const hairColor = HAIR_COLORS[avatar.hairColor] ?? HAIR_COLORS[0];
  const shirt = SHIRTS[avatar.shirt] ?? SHIRTS[0];
  const skinDark = shade(skin, -28);
  const tired = mood === "muede" || mood === "traurig";

  // Arm-Haltung je nach Laune
  const leftArm =
    mood === "top" ? "M66 124 Q40 116 42 86" : tired ? "M68 126 Q60 156 62 182" : "M66 124 Q52 150 56 174";
  const rightArm =
    mood === "top" || mood === "start" ? "M134 124 Q160 116 158 86" : tired ? "M132 126 Q140 156 138 182" : "M134 124 Q148 150 144 174";
  const leftHand = mood === "top" ? [42, 82] : tired ? [62, 186] : [56, 178];
  const rightHand = mood === "top" || mood === "start" ? [158, 82] : tired ? [138, 186] : [144, 178];

  const bodyShift = tired ? 6 : 0;
  const headTilt = mood === "traurig" ? -8 : mood === "muede" ? 6 : 0;
  const shoeColor = level >= 4 ? "#FF5A36" : "#2A2F2C";
  const cls = animate ? (mood === "top" ? "buddy-bounce" : mood === "start" ? "buddy-wave" : tired ? "" : "buddy-breathe") : "";

  return (
    <svg
      viewBox="0 0 200 260"
      width={size}
      height={(size * 260) / 200}
      role="img"
      aria-label={`Fitness-Buddy, Stimmung: ${mood}`}
      className={cls}
      style={{ overflow: "visible" }}
    >
      <ellipse cx="100" cy="250" rx={tired ? 50 : 44} ry="7" fill="rgba(21,32,27,0.12)" />

      <g transform={`translate(0 ${bodyShift})`}>
        {/* Beine & Schuhe */}
        <rect x="74" y="172" width="22" height="58" rx="10" fill="#2E3B35" />
        <rect x="104" y="172" width="22" height="58" rx="10" fill="#2E3B35" />
        <rect x="68" y="226" width="32" height="14" rx="7" fill={shoeColor} />
        <rect x="100" y="226" width="32" height="14" rx="7" fill={shoeColor} />
        {level >= 4 && (
          <>
            <rect x="72" y="232" width="24" height="3" rx="1.5" fill="#fff" opacity="0.8" />
            <rect x="104" y="232" width="24" height="3" rx="1.5" fill="#fff" opacity="0.8" />
          </>
        )}

        {/* Shorts */}
        <path d="M68 166 H132 V196 H104 L100 186 L96 196 H68 Z" fill="#23302A" />

        {/* Arme hinter dem Körper */}
        <path d={leftArm} stroke={skin} strokeWidth="16" strokeLinecap="round" fill="none" />
        <path d={rightArm} stroke={skin} strokeWidth="16" strokeLinecap="round" fill="none" />

        {/* Oberkörper / Shirt */}
        <path d="M64 120 Q64 108 78 106 H122 Q136 108 136 120 L134 172 H66 Z" fill={shirt} />
        <path d="M86 106 Q100 118 114 106" stroke={shade(shirt, -35)} strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Ärmel */}
        <circle cx="68" cy="122" r="11" fill={shirt} />
        <circle cx="132" cy="122" r="11" fill={shirt} />
        {/* Brust-Logo */}
        <path d="M92 140 l6 6 l12 -14" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

        {/* Medaille ab Level 6 */}
        {level >= 6 && (
          <g>
            <path d="M90 106 L100 136 L110 106" stroke="#C0392B" strokeWidth="5" fill="none" />
            <circle cx="100" cy="140" r="9" fill="#F2C14E" stroke="#C99A2E" strokeWidth="2" />
            <text x="100" y="144" textAnchor="middle" fontSize="10" fontWeight="700" fill="#7A5A10">1</text>
          </g>
        )}

        {/* Hände + Schweißbänder ab Level 3 */}
        {[leftHand, rightHand].map(([x, y], i) => (
          <g key={i}>
            {level >= 3 && <rect x={x - 9} y={y - (mood === "top" || (i === 1 && mood === "start") ? -2 : 12)} width="18" height="7" rx="3" fill="#fff" stroke={shirt} strokeWidth="2" />}
            <circle cx={x} cy={y} r="9" fill={skin} />
          </g>
        ))}

        {/* Hantel ab Level 5 */}
        {level >= 5 && (
          <g transform={`translate(${rightHand[0]} ${rightHand[1]})`}>
            <rect x="-16" y="-2.5" width="32" height="5" rx="2" fill="#555" />
            <rect x="-22" y="-9" width="8" height="18" rx="2" fill="#333" />
            <rect x="14" y="-9" width="8" height="18" rx="2" fill="#333" />
          </g>
        )}

        {/* Kopf */}
        <g transform={`rotate(${headTilt} 100 80)`}>
          <rect x="92" y="96" width="16" height="14" rx="6" fill={skinDark} />
          <circle cx="63" cy="82" r="7" fill={skin} />
          <circle cx="137" cy="82" r="7" fill={skin} />
          <circle cx="100" cy="78" r="37" fill={skin} />
          <Hair style={avatar.hair} color={hairColor} />

          {/* Stirnband ab Level 2 */}
          {level >= 2 && <path d="M64 66 Q100 54 136 66 L136 74 Q100 62 64 74 Z" fill={level >= 4 ? "#FF5A36" : "#fff"} stroke={shade(shirt, -10)} strokeWidth="1.5" />}

          {/* Augenbrauen */}
          {mood === "traurig" ? (
            <>
              <path d="M78 70 L90 66" stroke={shade(hairColor, 10)} strokeWidth="3" strokeLinecap="round" />
              <path d="M122 70 L110 66" stroke={shade(hairColor, 10)} strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M78 66 Q85 62 92 66" stroke={shade(hairColor, 10)} strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M108 66 Q115 62 122 66" stroke={shade(hairColor, 10)} strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Augen */}
          {mood === "muede" ? (
            <>
              <path d="M79 79 Q85 83 91 79" stroke="#1d2420" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M109 79 Q115 83 121 79" stroke="#1d2420" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : mood === "top" ? (
            <>
              <path d="M79 80 Q85 73 91 80" stroke="#1d2420" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M109 80 Q115 73 121 80" stroke="#1d2420" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="85" cy={mood === "traurig" ? 80 : 78} r="5" fill="#1d2420" />
              <circle cx="115" cy={mood === "traurig" ? 80 : 78} r="5" fill="#1d2420" />
              <circle cx="86.5" cy={mood === "traurig" ? 78.5 : 76.5} r="1.6" fill="#fff" />
              <circle cx="116.5" cy={mood === "traurig" ? 78.5 : 76.5} r="1.6" fill="#fff" />
            </>
          )}

          {/* Wangen */}
          {(mood === "top" || mood === "start") && (
            <>
              <ellipse cx="76" cy="92" rx="6" ry="3.5" fill="#F28B82" opacity="0.5" />
              <ellipse cx="124" cy="92" rx="6" ry="3.5" fill="#F28B82" opacity="0.5" />
            </>
          )}

          {/* Mund */}
          {mood === "top" ? (
            <path d="M86 92 Q100 108 114 92 Z" fill="#7A2E2E" />
          ) : mood === "traurig" ? (
            <path d="M88 100 Q100 92 112 100" stroke="#7A2E2E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          ) : mood === "muede" ? (
            <ellipse cx="100" cy="97" rx="5" ry="6" fill="#7A2E2E" />
          ) : (
            <path d="M88 94 Q100 104 112 94" stroke="#7A2E2E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          )}

          {/* Träne / Schweiß */}
          {mood === "traurig" && <path d="M122 86 q-4 8 0 10 q4 -2 0 -10 Z" fill="#6EC3F0" />}
        </g>
      </g>

      {/* Zzz bei Müdigkeit */}
      {mood === "muede" && (
        <g fill="#8a948f" fontWeight="700">
          <text x="146" y="44" fontSize="16">z</text>
          <text x="158" y="30" fontSize="20">Z</text>
        </g>
      )}
      {mood === "top" && (
        <g fill="#F2C14E">
          <path d="M30 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" />
          <path d="M168 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" />
        </g>
      )}
    </svg>
  );
}
