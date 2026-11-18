// Kuratierte Übungsliste (ca. 30 Übungen). Die KI darf NUR Übungen aus dieser Liste verwenden.
// Wird von Convex-Funktionen und vom Frontend gemeinsam genutzt.

export type Equipment = "bodyweight" | "dumbbell" | "gym";
export type Category = "kraft" | "mobilitaet" | "ausdauer";
export type Pattern =
  | "beine"
  | "huefte"
  | "druecken"
  | "ziehen"
  | "rumpf"
  | "mobilitaet"
  | "ausdauer";

export type Group =
  | "brust"
  | "ruecken"
  | "schultern"
  | "bizeps"
  | "trizeps"
  | "beine"
  | "po"
  | "bauch"
  | "mobil"
  | "cardio";

export type Exercise = {
  id: string;
  group: Group;
  name: string;
  equipment: Equipment;
  category: Category;
  pattern: Pattern;
  muscles: string;
  usesWeight: boolean;
  unit: "wdh" | "sek";
  baseWhy: string;
  sittingWhy?: string;
  steps: string[];
  mistakes: string[];
};

export const EXERCISES: Exercise[] = [
  // ---------- Studio (Geräte) ----------
  {
    id: "beinpresse",
    group: "beine",
    name: "Beinpresse",
    equipment: "gym",
    category: "kraft",
    pattern: "beine",
    muscles: "Oberschenkel und Po",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Trainiert Oberschenkel und Po sicher geführt – ideal, um Kraft in den Beinen aufzubauen, ohne dass du die Balance halten musst.",
    steps: [
      "Setz dich, Rücken und Kopf liegen am Polster an.",
      "Füße hüftbreit mittig auf die Platte stellen.",
      "Sicherung lösen, Knie langsam beugen bis ca. 90 Grad.",
      "Über die ganze Fußsohle zurückdrücken, Knie nicht ganz durchstrecken.",
    ],
    mistakes: [
      "Knie fallen nach innen – drück sie leicht nach außen.",
      "Unterer Rücken hebt vom Polster ab – geh nicht zu tief.",
    ],
  },
  {
    id: "latzug",
    group: "ruecken",
    name: "Latzug",
    equipment: "gym",
    category: "kraft",
    pattern: "ziehen",
    muscles: "oberer Rücken und Arme",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Stärkt den breiten Rückenmuskel und sorgt für eine aufrechte Haltung – der Gegenspieler zu allen Drückübungen.",
    sittingWhy:
      "Zieht die Schultern zurück und hilft gegen den runden Rücken vom Sitzen.",
    steps: [
      "Oberschenkel unter dem Polster fixieren, Stange etwas breiter als schulterbreit greifen.",
      "Brust leicht nach vorne, Schultern nach unten ziehen.",
      "Stange zur oberen Brust ziehen, Ellenbogen zeigen nach unten.",
      "Kontrolliert wieder nach oben führen.",
    ],
    mistakes: [
      "Stange in den Nacken ziehen – immer vor den Kopf.",
      "Mit dem ganzen Oberkörper Schwung holen.",
    ],
  },
  {
    id: "rudern_kabel",
    group: "ruecken",
    name: "Rudern am Kabelzug",
    equipment: "gym",
    category: "kraft",
    pattern: "ziehen",
    muscles: "mittlerer Rücken und Schultern",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Kräftigt den mittleren Rücken zwischen den Schulterblättern – wichtig für eine stabile, aufrechte Haltung.",
    sittingWhy:
      "Gleicht nach vorne gezogene Schultern aus, die durch langes Sitzen am Schreibtisch entstehen.",
    steps: [
      "Aufrecht hinsetzen, Füße an die Stützen, Knie leicht gebeugt.",
      "Griff mit gestreckten Armen halten, Brust raus.",
      "Griff zum Bauch ziehen und Schulterblätter zusammendrücken.",
      "Langsam zurück, bis die Arme gestreckt sind.",
    ],
    mistakes: [
      "Rundrücken beim Zurückführen.",
      "Weit nach hinten lehnen statt mit dem Rücken zu ziehen.",
    ],
  },
  {
    id: "brustpresse",
    group: "brust",
    name: "Brustpresse (Maschine)",
    equipment: "gym",
    category: "kraft",
    pattern: "druecken",
    muscles: "Brust, Schultern und Trizeps",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Baut Brust und Arme geführt auf – einfacher zu lernen als freies Bankdrücken und daher ideal für den Einstieg.",
    steps: [
      "Sitz so einstellen, dass die Griffe auf Brusthöhe sind.",
      "Rücken ans Polster, Schulterblätter leicht zusammen.",
      "Griffe nach vorne drücken, Arme fast strecken.",
      "Langsam zurückführen, bis du eine Dehnung in der Brust spürst.",
    ],
    mistakes: [
      "Schultern ziehen nach oben zu den Ohren.",
      "Gewicht unkontrolliert zurückfallen lassen.",
    ],
  },
  {
    id: "schulterpresse",
    group: "schultern",
    name: "Schulterpresse (Maschine)",
    equipment: "gym",
    category: "kraft",
    pattern: "druecken",
    muscles: "Schultern und Trizeps",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Stärkt die Schultern für alles, was du über Kopf hebst, und rundet den Oberkörper ab.",
    steps: [
      "Sitzhöhe so einstellen, dass die Griffe auf Schulterhöhe sind.",
      "Rücken fest ans Polster.",
      "Griffe nach oben drücken, ohne die Ellenbogen ganz durchzustrecken.",
      "Kontrolliert bis Schulterhöhe absenken.",
    ],
    mistakes: [
      "Hohlkreuz beim Drücken.",
      "Zu schweres Gewicht mit Schwung bewegen.",
    ],
  },
  {
    id: "beinbeuger",
    group: "beine",
    name: "Beinbeuger (Maschine)",
    equipment: "gym",
    category: "kraft",
    pattern: "huefte",
    muscles: "Oberschenkelrückseite",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Kräftigt die Oberschenkelrückseite – schützt die Knie und gleicht das Training der Vorderseite aus.",
    sittingWhy:
      "Die Oberschenkelrückseite verkürzt durch langes Sitzen – hier wird sie gezielt gekräftigt.",
    steps: [
      "Maschine so einstellen, dass das Polster knapp über den Fersen liegt.",
      "Knie auf Höhe des Drehpunkts der Maschine.",
      "Fersen Richtung Po ziehen.",
      "Langsam zurück in die Streckung.",
    ],
    mistakes: [
      "Hüfte hebt vom Polster ab.",
      "Bewegung zu schnell, ohne Kontrolle.",
    ],
  },
  {
    id: "rueckenstrecker",
    group: "po",
    name: "Rückenstrecker (Hyperextension)",
    equipment: "gym",
    category: "kraft",
    pattern: "huefte",
    muscles: "unterer Rücken und Po",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Stärkt den unteren Rücken und den Po – eine kräftige Rückseite beugt Rückenschmerzen vor.",
    sittingWhy:
      "Wirkt dem schwachen unteren Rücken entgegen, der durch viel Sitzen entsteht.",
    steps: [
      "Hüfte liegt am Polster, Füße sind fixiert.",
      "Arme vor der Brust verschränken.",
      "Oberkörper langsam absenken.",
      "Bis in eine gerade Linie hochkommen – nicht weiter.",
    ],
    mistakes: [
      "Ins Hohlkreuz überstrecken.",
      "Mit Schwung arbeiten.",
    ],
  },
  {
    id: "crosstrainer",
    group: "cardio",
    name: "Crosstrainer",
    equipment: "gym",
    category: "ausdauer",
    pattern: "ausdauer",
    muscles: "Herz-Kreislauf, ganzer Körper",
    usesWeight: false,
    unit: "sek",
    baseWhy:
      "Trainiert Herz und Ausdauer gelenkschonend und wärmt den ganzen Körper auf.",
    steps: [
      "Auf die Pedale stellen, Griffe locker halten.",
      "Gleichmäßig in einem Tempo treten, bei dem du noch sprechen kannst.",
      "Widerstand so wählen, dass es leicht anstrengend ist.",
    ],
    mistakes: [
      "Zu fest an die Griffe klammern.",
      "Gleich zu Beginn zu schnell starten.",
    ],
  },
  {
    id: "ergometer",
    group: "cardio",
    name: "Fahrrad-Ergometer",
    equipment: "gym",
    category: "ausdauer",
    pattern: "ausdauer",
    muscles: "Herz-Kreislauf und Beine",
    usesWeight: false,
    unit: "sek",
    baseWhy:
      "Verbessert deine Ausdauer und verbrennt Energie, ohne die Gelenke zu belasten.",
    steps: [
      "Sattel auf Hüfthöhe einstellen.",
      "Gleichmäßig mit 70–90 Umdrehungen pro Minute treten.",
      "Widerstand so wählen, dass du leicht ins Schwitzen kommst.",
    ],
    mistakes: [
      "Sattel zu niedrig – belastet die Knie.",
      "Mit zu hohem Widerstand starten.",
    ],
  },
  // ---------- Kurzhanteln ----------
  {
    id: "goblet_squat",
    group: "beine",
    name: "Goblet Squat",
    equipment: "dumbbell",
    category: "kraft",
    pattern: "beine",
    muscles: "Oberschenkel, Po und Rumpf",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Die Hantel vor der Brust hilft dir, aufrecht zu bleiben – so lernst du die Kniebeuge sauber und trainierst Beine und Po.",
    steps: [
      "Hantel senkrecht vor der Brust halten.",
      "Füße etwas breiter als hüftbreit, Zehen leicht nach außen.",
      "Hüfte nach hinten unten absenken, Brust bleibt aufrecht.",
      "Über die Fersen kraftvoll aufstehen.",
    ],
    mistakes: [
      "Fersen heben vom Boden ab.",
      "Knie fallen nach innen.",
    ],
  },
  {
    id: "rumaenisches_kreuzheben",
    group: "po",
    name: "Rumänisches Kreuzheben (Kurzhantel)",
    equipment: "dumbbell",
    category: "kraft",
    pattern: "huefte",
    muscles: "Oberschenkelrückseite, Po und unterer Rücken",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Trainiert die gesamte Körperrückseite und bringt dir bei, Lasten rückenschonend aus der Hüfte zu heben.",
    sittingWhy:
      "Stärkt Po und Oberschenkelrückseite, die bei viel Sitzen schwach und verkürzt werden.",
    steps: [
      "Hanteln vor den Oberschenkeln halten, Knie leicht gebeugt.",
      "Hüfte nach hinten schieben, Rücken bleibt gerade.",
      "Hanteln nah an den Beinen bis unter die Knie absenken.",
      "Hüfte nach vorne schieben und aufrichten.",
    ],
    mistakes: [
      "Runder Rücken.",
      "Hanteln weit vom Körper entfernt.",
    ],
  },
  {
    id: "kh_rudern",
    group: "ruecken",
    name: "Einarmiges Kurzhantel-Rudern",
    equipment: "dumbbell",
    category: "kraft",
    pattern: "ziehen",
    muscles: "Rücken und Bizeps",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Kräftigt den Rücken Seite für Seite und verbessert deine Haltung.",
    sittingWhy:
      "Zieht die Schultern zurück – ein Ausgleich zur gebeugten Haltung am Schreibtisch.",
    steps: [
      "Eine Hand und ein Knie auf Bank oder Stuhl abstützen.",
      "Rücken gerade, Hantel hängt unter der Schulter.",
      "Hantel zur Hüfte ziehen, Ellenbogen nah am Körper.",
      "Langsam absenken.",
    ],
    mistakes: [
      "Oberkörper dreht sich mit.",
      "Hantel nur mit dem Arm statt mit dem Rücken ziehen.",
    ],
  },
  {
    id: "kh_bankdruecken",
    group: "brust",
    name: "Kurzhantel-Bodendrücken",
    equipment: "dumbbell",
    category: "kraft",
    pattern: "druecken",
    muscles: "Brust, Schultern und Trizeps",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Trainiert Brust und Arme. Auf dem Boden ist die Bewegung begrenzt – das schont die Schultern beim Einstieg.",
    steps: [
      "Rücklings auf den Boden legen, Knie angewinkelt.",
      "Hanteln über der Brust, Oberarme im 45-Grad-Winkel zum Körper.",
      "Absenken, bis die Oberarme den Boden berühren.",
      "Hanteln wieder nach oben drücken.",
    ],
    mistakes: [
      "Ellenbogen stehen 90 Grad seitlich ab.",
      "Hanteln prallen auf den Boden.",
    ],
  },
  {
    id: "kh_schulterdruecken",
    group: "schultern",
    name: "Kurzhantel-Schulterdrücken",
    equipment: "dumbbell",
    category: "kraft",
    pattern: "druecken",
    muscles: "Schultern und Trizeps",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Stärkt die Schultern und stabilisiert gleichzeitig den Rumpf.",
    steps: [
      "Sitzend oder stehend, Hanteln auf Schulterhöhe.",
      "Bauch anspannen.",
      "Hanteln über den Kopf drücken.",
      "Kontrolliert zurück auf Schulterhöhe.",
    ],
    mistakes: [
      "Hohlkreuz beim Drücken.",
      "Hanteln vor dem Körper statt über dem Kopf.",
    ],
  },
  {
    id: "ausfallschritt_kh",
    group: "beine",
    name: "Ausfallschritt mit Kurzhanteln",
    equipment: "dumbbell",
    category: "kraft",
    pattern: "beine",
    muscles: "Oberschenkel, Po und Gleichgewicht",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Trainiert jedes Bein einzeln und verbessert Gleichgewicht und Stabilität für den Alltag.",
    steps: [
      "Aufrecht stehen, Hanteln seitlich halten.",
      "Großen Schritt nach vorne machen.",
      "Hinteres Knie Richtung Boden absenken.",
      "Über die vordere Ferse zurückdrücken.",
    ],
    mistakes: [
      "Vorderes Knie knickt nach innen.",
      "Oberkörper kippt nach vorne.",
    ],
  },
  {
    id: "bizepscurl",
    group: "bizeps",
    name: "Bizeps-Curl",
    equipment: "dumbbell",
    category: "kraft",
    pattern: "ziehen",
    muscles: "Bizeps",
    usesWeight: true,
    unit: "wdh",
    baseWhy:
      "Kräftigt die Arme gezielt – hilft beim Tragen und Heben im Alltag.",
    steps: [
      "Aufrecht stehen, Hanteln seitlich, Handflächen nach vorne.",
      "Ellenbogen bleiben am Körper.",
      "Hanteln zu den Schultern beugen.",
      "Langsam absenken.",
    ],
    mistakes: [
      "Mit dem Oberkörper Schwung holen.",
      "Ellenbogen wandern nach vorne.",
    ],
  },
  // ---------- Eigengewicht ----------
  {
    id: "kniebeuge",
    group: "beine",
    name: "Kniebeuge (Eigengewicht)",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "beine",
    muscles: "Oberschenkel und Po",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Die Grundübung für starke Beine – du brauchst die Bewegung jeden Tag, z. B. beim Hinsetzen und Aufstehen.",
    steps: [
      "Füße schulterbreit, Zehen leicht nach außen.",
      "Arme nach vorne strecken für die Balance.",
      "Hüfte nach hinten unten absenken, Brust bleibt oben.",
      "Über die Fersen aufstehen.",
    ],
    mistakes: [
      "Knie fallen nach innen.",
      "Fersen heben ab.",
    ],
  },
  {
    id: "liegestuetz_erhoeht",
    group: "brust",
    name: "Liegestütz (erhöht)",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "druecken",
    muscles: "Brust, Schultern und Trizeps",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Die Hände auf einer Erhöhung machen den Liegestütz leichter – so baust du Brust- und Armkraft sauber auf.",
    steps: [
      "Hände schulterbreit auf Tisch, Bank oder Sofa.",
      "Körper bildet eine gerade Linie von Kopf bis Fuß.",
      "Brust zur Kante absenken.",
      "Wieder hochdrücken.",
    ],
    mistakes: [
      "Hüfte hängt durch.",
      "Ellenbogen stehen weit seitlich ab.",
    ],
  },
  {
    id: "liegestuetz",
    group: "brust",
    name: "Liegestütz",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "druecken",
    muscles: "Brust, Schultern und Trizeps",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Trainiert Brust, Schultern, Arme und Rumpf gleichzeitig – ganz ohne Geräte.",
    steps: [
      "Hände etwas breiter als schulterbreit auf den Boden.",
      "Körper in einer geraden Linie anspannen.",
      "Brust Richtung Boden absenken.",
      "Kraftvoll hochdrücken.",
    ],
    mistakes: [
      "Hohlkreuz oder Po zu hoch.",
      "Nur halbe Bewegung.",
    ],
  },
  {
    id: "glute_bridge",
    group: "po",
    name: "Glute Bridge (Beckenheben)",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "huefte",
    muscles: "Po und Oberschenkelrückseite",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Aktiviert den Po – einen der wichtigsten Muskeln für einen gesunden unteren Rücken.",
    sittingWhy:
      "Langes Sitzen 'schaltet' den Po ab – diese Übung aktiviert ihn wieder und entlastet den Rücken.",
    steps: [
      "Auf den Rücken legen, Füße hüftbreit aufstellen.",
      "Po anspannen und Becken nach oben schieben.",
      "Oben kurz halten – Schultern, Hüfte und Knie bilden eine Linie.",
      "Langsam absenken.",
    ],
    mistakes: [
      "Ins Hohlkreuz drücken statt den Po anzuspannen.",
      "Füße zu weit vom Po entfernt.",
    ],
  },
  {
    id: "unterarmstuetz",
    group: "bauch",
    name: "Unterarmstütz (Plank)",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "rumpf",
    muscles: "Bauch und gesamter Rumpf",
    usesWeight: false,
    unit: "sek",
    baseWhy:
      "Stärkt die gesamte Körpermitte – ein stabiler Rumpf schützt deinen Rücken bei allen anderen Übungen.",
    steps: [
      "Unterarme unter den Schultern abstützen.",
      "Beine gestreckt, auf die Zehen.",
      "Bauch und Po anspannen, Körper bildet eine Linie.",
      "Position halten und ruhig weiteratmen.",
    ],
    mistakes: [
      "Hüfte hängt durch.",
      "Luft anhalten.",
    ],
  },
  {
    id: "dead_bug",
    group: "bauch",
    name: "Dead Bug",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "rumpf",
    muscles: "tiefe Bauchmuskulatur",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Trainiert die tiefe Bauchmuskulatur rückenschonend und verbessert die Koordination.",
    steps: [
      "Auf den Rücken legen, Arme zur Decke, Knie im 90-Grad-Winkel.",
      "Unteren Rücken in den Boden drücken.",
      "Gegenüberliegenden Arm und Bein langsam strecken.",
      "Zurück zur Mitte und Seite wechseln.",
    ],
    mistakes: [
      "Unterer Rücken hebt vom Boden ab.",
      "Zu schnell ausführen.",
    ],
  },
  {
    id: "seitstuetz",
    group: "bauch",
    name: "Seitstütz",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "rumpf",
    muscles: "seitliche Bauchmuskeln",
    usesWeight: false,
    unit: "sek",
    baseWhy:
      "Kräftigt die seitliche Rumpfmuskulatur, die deine Wirbelsäule stabilisiert.",
    steps: [
      "Seitlich auf den Unterarm stützen, Ellenbogen unter der Schulter.",
      "Beine gestreckt übereinander.",
      "Hüfte anheben, bis der Körper eine Linie bildet.",
      "Halten, dann Seite wechseln.",
    ],
    mistakes: [
      "Hüfte sinkt ab.",
      "Oberkörper kippt nach vorne.",
    ],
  },
  {
    id: "superman",
    group: "ruecken",
    name: "Superman (Rückenheben im Liegen)",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "ziehen",
    muscles: "Rücken und Schultern",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Stärkt die gesamte Rückenmuskulatur ohne Geräte und verbessert die Haltung.",
    sittingWhy:
      "Kräftigt den oberen Rücken, der beim Sitzen nach vorne sinkt.",
    steps: [
      "Bäuchlings hinlegen, Arme nach vorne gestreckt.",
      "Blick zum Boden.",
      "Arme und Beine gleichzeitig leicht anheben.",
      "Kurz halten und langsam absenken.",
    ],
    mistakes: [
      "Kopf in den Nacken legen.",
      "Zu hoch überstrecken.",
    ],
  },
  {
    id: "ausfallschritt",
    group: "beine",
    name: "Ausfallschritt (Eigengewicht)",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "beine",
    muscles: "Oberschenkel, Po und Gleichgewicht",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Trainiert die Beine einzeln und verbessert dein Gleichgewicht.",
    steps: [
      "Aufrecht stehen, Hände an der Hüfte.",
      "Großen Schritt nach vorne.",
      "Hinteres Knie Richtung Boden absenken.",
      "Zurückdrücken und Seite wechseln.",
    ],
    mistakes: [
      "Schritt zu kurz.",
      "Vorderes Knie knickt nach innen.",
    ],
  },
  {
    id: "hampelmann",
    group: "cardio",
    name: "Hampelmann",
    equipment: "bodyweight",
    category: "ausdauer",
    pattern: "ausdauer",
    muscles: "Herz-Kreislauf, ganzer Körper",
    usesWeight: false,
    unit: "sek",
    baseWhy:
      "Bringt den Puls hoch, wärmt den ganzen Körper auf und trainiert deine Ausdauer.",
    steps: [
      "Aufrecht stehen, Arme seitlich.",
      "Springend die Beine öffnen und Arme über den Kopf führen.",
      "Zurückspringen in die Ausgangsposition.",
      "Gleichmäßiges Tempo halten.",
    ],
    mistakes: [
      "Auf den Fersen landen.",
      "Zu schnell starten und gleich außer Atem sein.",
    ],
  },
  {
    id: "mountain_climbers",
    group: "cardio",
    name: "Mountain Climbers",
    equipment: "bodyweight",
    category: "ausdauer",
    pattern: "ausdauer",
    muscles: "Herz-Kreislauf und Rumpf",
    usesWeight: false,
    unit: "sek",
    baseWhy:
      "Kombiniert Ausdauer und Rumpfkraft – ideal, um in kurzer Zeit viel Energie zu verbrauchen.",
    steps: [
      "In die Liegestützposition gehen.",
      "Ein Knie Richtung Brust ziehen.",
      "Schnell die Beine wechseln.",
      "Hüfte bleibt auf Schulterhöhe.",
    ],
    mistakes: [
      "Po zu hoch.",
      "Schultern nicht über den Händen.",
    ],
  },
  // ---------- Mobilität ----------
  {
    id: "katze_kuh",
    group: "mobil",
    name: "Katze-Kuh",
    equipment: "bodyweight",
    category: "mobilitaet",
    pattern: "mobilitaet",
    muscles: "Wirbelsäule und Rücken",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Mobilisiert die Wirbelsäule Wirbel für Wirbel und löst Verspannungen im Rücken.",
    sittingWhy:
      "Löst die Steifheit im Rücken, die durch stundenlanges Sitzen entsteht.",
    steps: [
      "Vierfüßlerstand: Hände unter Schultern, Knie unter Hüfte.",
      "Ausatmen und Rücken rund machen (Katze).",
      "Einatmen und Rücken sanft durchhängen lassen (Kuh).",
      "Langsam im Atemrhythmus wechseln.",
    ],
    mistakes: [
      "Zu schnell bewegen.",
      "Nur den Kopf statt die Wirbelsäule bewegen.",
    ],
  },
  {
    id: "hueftbeuger_dehnung",
    group: "mobil",
    name: "Hüftbeuger-Dehnung",
    equipment: "bodyweight",
    category: "mobilitaet",
    pattern: "mobilitaet",
    muscles: "Hüftbeuger",
    usesWeight: false,
    unit: "sek",
    baseWhy:
      "Dehnt die vordere Hüfte und verbessert deine Beweglichkeit bei Kniebeugen und beim Gehen.",
    sittingWhy:
      "Gleicht langes Sitzen aus: Der Hüftbeuger verkürzt im Sitzen und zieht am unteren Rücken.",
    steps: [
      "In den Kniestand gehen, ein Bein vorne aufgestellt.",
      "Po anspannen, Becken leicht nach vorne schieben.",
      "Dehnung vorne an der Hüfte spüren und halten.",
      "Seite wechseln.",
    ],
    mistakes: [
      "Ins Hohlkreuz fallen.",
      "Vorderes Knie weit über die Zehen schieben.",
    ],
  },
  {
    id: "brustwirbel_rotation",
    group: "mobil",
    name: "Brustwirbelsäulen-Rotation",
    equipment: "bodyweight",
    category: "mobilitaet",
    pattern: "mobilitaet",
    muscles: "oberer Rücken",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Macht den oberen Rücken beweglicher – das entlastet Schultern und Nacken.",
    sittingWhy:
      "Bringt Bewegung in den oberen Rücken, der am Schreibtisch steif wird.",
    steps: [
      "Seitlich hinlegen, Knie angewinkelt, Arme vorne aufeinander.",
      "Oberen Arm in einem Bogen zur anderen Seite öffnen.",
      "Blick folgt der Hand, Knie bleiben am Boden.",
      "Langsam zurück, nach den Wiederholungen Seite wechseln.",
    ],
    mistakes: [
      "Knie heben vom Boden ab.",
      "Bewegung erzwingen statt locker zu öffnen.",
    ],
  },
  {
    id: "weltbeste_dehnung",
    group: "mobil",
    name: "Ausfallschritt mit Rotation",
    equipment: "bodyweight",
    category: "mobilitaet",
    pattern: "mobilitaet",
    muscles: "Hüfte, Rücken und Beine",
    usesWeight: false,
    unit: "wdh",
    baseWhy:
      "Mobilisiert Hüfte, Beine und Rücken in einer Bewegung – ein perfektes Aufwärmen.",
    sittingWhy:
      "Öffnet Hüfte und Brustkorb, die durch Sitzen eng werden.",
    steps: [
      "Großen Ausfallschritt nach vorne.",
      "Hand neben den vorderen Fuß auf den Boden.",
      "Anderen Arm zur Decke drehen.",
      "Zurück und Seite wechseln.",
    ],
    mistakes: [
      "Hüfte sinkt nicht tief genug.",
      "Zu schnell ausführen.",
    ],
  },
  // ---------- Ergänzungen für Splits und längere Einheiten ----------
  {
    id: "beinstrecker",
    group: "beine",
    name: "Beinstrecker (Maschine)",
    equipment: "gym",
    category: "kraft",
    pattern: "beine",
    muscles: "vordere Oberschenkel",
    usesWeight: true,
    unit: "wdh",
    baseWhy: "Kräftigt gezielt die vordere Oberschenkelmuskulatur – sie stabilisiert dein Knie beim Gehen, Treppensteigen und Springen.",
    steps: [
      "Rückenlehne so einstellen, dass die Knie am Drehpunkt der Maschine liegen.",
      "Polster liegt vorne knapp über den Fußgelenken.",
      "Beine kontrolliert strecken, oben kurz halten.",
      "Langsam wieder absenken.",
    ],
    mistakes: ["Mit Schwung arbeiten.", "Gesäß hebt vom Sitz ab."],
  },
  {
    id: "wadenheben",
    group: "beine",
    name: "Wadenheben",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "beine",
    muscles: "Waden",
    usesWeight: false,
    unit: "wdh",
    baseWhy: "Stärkt die Waden und stabilisiert dein Sprunggelenk – hilfreich beim Laufen und im Alltag.",
    steps: [
      "Hüftbreit hinstellen, bei Bedarf an der Wand festhalten.",
      "Langsam auf die Zehenspitzen drücken.",
      "Oben kurz halten.",
      "Kontrolliert absenken.",
    ],
    mistakes: ["Zu schnell wippen.", "Nur halbe Bewegung."],
  },
  {
    id: "hip_thrust_kh",
    group: "po",
    name: "Hip Thrust mit Kurzhantel",
    equipment: "dumbbell",
    category: "kraft",
    pattern: "huefte",
    muscles: "Po und Oberschenkelrückseite",
    usesWeight: true,
    unit: "wdh",
    baseWhy: "Die effektivste Übung für einen kräftigen Po – der wichtigste Muskel für eine stabile Hüfte und einen entlasteten Rücken.",
    sittingWhy: "Weckt den Po, der durch langes Sitzen träge wird, und entlastet so den unteren Rücken.",
    steps: [
      "Schulterblätter an eine Bank oder ein Sofa lehnen.",
      "Hantel auf die Hüfte legen und festhalten.",
      "Po anspannen und Hüfte nach oben schieben.",
      "Langsam absenken.",
    ],
    mistakes: ["Ins Hohlkreuz drücken.", "Füße zu nah am Po."],
  },
  {
    id: "seitheben",
    group: "schultern",
    name: "Seitheben mit Kurzhanteln",
    equipment: "dumbbell",
    category: "kraft",
    pattern: "druecken",
    muscles: "seitliche Schultern",
    usesWeight: true,
    unit: "wdh",
    baseWhy: "Trainiert die seitlichen Schultern – sie sorgen für stabile Schultergelenke und eine breitere Silhouette.",
    steps: [
      "Aufrecht stehen, leichte Hanteln seitlich halten.",
      "Arme leicht gebeugt seitlich bis Schulterhöhe heben.",
      "Kurz halten.",
      "Langsam absenken.",
    ],
    mistakes: ["Zu schweres Gewicht mit Schwung.", "Schultern zu den Ohren ziehen."],
  },
  {
    id: "face_pulls",
    group: "schultern",
    name: "Face Pulls am Kabelzug",
    equipment: "gym",
    category: "kraft",
    pattern: "ziehen",
    muscles: "hintere Schultern und oberer Rücken",
    usesWeight: true,
    unit: "wdh",
    baseWhy: "Stärkt die hinteren Schultern – das Gegengewicht zu Drückübungen und gut für die Schultergesundheit.",
    sittingWhy: "Zieht die Schultern zurück und hilft gegen die nach vorne gerundete Haltung vom Schreibtisch.",
    steps: [
      "Seil auf Kopfhöhe einhängen, mit beiden Händen greifen.",
      "Seil Richtung Gesicht ziehen, Ellenbogen gehen nach außen.",
      "Schulterblätter zusammendrücken.",
      "Kontrolliert zurück.",
    ],
    mistakes: ["Mit dem Oberkörper nach hinten lehnen.", "Ellenbogen zu tief."],
  },
  {
    id: "trizeps_kabel",
    group: "trizeps",
    name: "Trizepsdrücken am Kabelzug",
    equipment: "gym",
    category: "kraft",
    pattern: "druecken",
    muscles: "Trizeps (Armrückseite)",
    usesWeight: true,
    unit: "wdh",
    baseWhy: "Kräftigt die Armrückseite – sie hilft bei allen Drückbewegungen wie Liegestütz oder Brustpresse.",
    steps: [
      "Vor den Kabelzug stellen, Griff oder Seil oben greifen.",
      "Ellenbogen eng am Körper fixieren.",
      "Unterarme nach unten strecken.",
      "Langsam zurück bis ca. 90 Grad.",
    ],
    mistakes: ["Ellenbogen wandern nach vorne.", "Mit dem Oberkörper mitdrücken."],
  },
  {
    id: "trizeps_kickback",
    group: "trizeps",
    name: "Trizeps-Kickback",
    equipment: "dumbbell",
    category: "kraft",
    pattern: "druecken",
    muscles: "Trizeps (Armrückseite)",
    usesWeight: true,
    unit: "wdh",
    baseWhy: "Trainiert die Armrückseite gezielt mit einer Hantel – für kräftigere Arme beim Drücken und Abstützen.",
    steps: [
      "Oberkörper nach vorne neigen, eine Hand abstützen.",
      "Oberarm parallel zum Körper halten.",
      "Unterarm nach hinten strecken.",
      "Langsam zurückführen.",
    ],
    mistakes: ["Oberarm bewegt sich mit.", "Zu schnell schwingen."],
  },
  {
    id: "dips_bank",
    group: "trizeps",
    name: "Dips an Bank oder Stuhl",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "druecken",
    muscles: "Trizeps und Schultern",
    usesWeight: false,
    unit: "wdh",
    baseWhy: "Kräftigt Armrückseite und Schultern mit dem eigenen Körpergewicht – ganz ohne Geräte.",
    steps: [
      "Hände hinter dir auf eine stabile Bank oder einen Stuhl.",
      "Beine angewinkelt, Po nah an der Kante.",
      "Ellenbogen nach hinten beugen und absenken.",
      "Wieder hochdrücken.",
    ],
    mistakes: ["Zu tief absenken – Schultern schmerzen.", "Ellenbogen gehen nach außen."],
  },
  {
    id: "tischrudern",
    group: "ruecken",
    name: "Rudern unter dem Tisch",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "ziehen",
    muscles: "Rücken und Bizeps",
    usesWeight: false,
    unit: "wdh",
    baseWhy: "Rückentraining ohne Geräte: Du ziehst dich an einer stabilen Tischkante hoch und kräftigst so den oberen Rücken.",
    sittingWhy: "Stärkt den oberen Rücken und hilft gegen die gebeugte Haltung vom Sitzen.",
    steps: [
      "Unter einen sehr stabilen Tisch legen, Kante schulterbreit greifen.",
      "Körper gestreckt, Fersen am Boden.",
      "Brust zur Tischkante ziehen.",
      "Langsam ablassen.",
    ],
    mistakes: ["Hüfte hängt durch.", "Wackeliger Tisch – Sicherheit geht vor."],
  },
  {
    id: "crunch",
    group: "bauch",
    name: "Crunch",
    equipment: "bodyweight",
    category: "kraft",
    pattern: "rumpf",
    muscles: "gerade Bauchmuskeln",
    usesWeight: false,
    unit: "wdh",
    baseWhy: "Trainiert die geraden Bauchmuskeln und stärkt deine Körpermitte.",
    steps: [
      "Auf den Rücken legen, Beine angewinkelt.",
      "Hände locker an die Schläfen.",
      "Schultern leicht vom Boden heben, Blick zur Decke.",
      "Langsam ablegen.",
    ],
    mistakes: ["Am Nacken ziehen.", "Mit Schwung hochkommen."],
  },
  {
    id: "joggen",
    group: "cardio",
    name: "Lockeres Laufen / zügiges Gehen",
    equipment: "bodyweight",
    category: "ausdauer",
    pattern: "ausdauer",
    muscles: "Herz-Kreislauf und Beine",
    usesWeight: false,
    unit: "sek",
    baseWhy: "Stärkt Herz und Ausdauer und lässt sich überall machen – draußen oder auf dem Laufband.",
    steps: [
      "Locker starten, die ersten Minuten zügig gehen.",
      "In ein Tempo wechseln, bei dem du dich noch unterhalten kannst.",
      "Gleichmäßig atmen.",
      "Zum Schluss ein paar Minuten auslaufen.",
    ],
    mistakes: ["Zu schnell starten.", "Ungeeignete Schuhe."],
  },
  {
    id: "cooldown",
    group: "mobil",
    name: "Cool-down: Dehnen & Entspannen",
    equipment: "bodyweight",
    category: "mobilitaet",
    pattern: "mobilitaet",
    muscles: "ganzer Körper",
    usesWeight: false,
    unit: "sek",
    baseWhy: "Ruhiges Dehnen nach dem Training senkt den Puls, lockert die trainierten Muskeln und hilft dir, runterzukommen.",
    sittingWhy: "Dehnt Hüfte, Brust und Oberschenkelrückseite – genau die Bereiche, die beim Sitzen verkürzen.",
    steps: [
      "Puls ein paar Minuten locker ausklingen lassen.",
      "Die trainierten Muskeln je 30–45 Sekunden sanft dehnen.",
      "Ruhig und tief atmen, nicht wippen.",
      "Zum Schluss eine Minute entspannt liegen.",
    ],
    mistakes: ["Ruckartig dehnen.", "Bis in den Schmerz gehen."],
  },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

export type Location = "gym" | "home_none" | "home_db";

export function allowedEquipment(location: Location): Equipment[] {
  if (location === "gym") return ["gym", "dumbbell", "bodyweight"];
  if (location === "home_db") return ["dumbbell", "bodyweight"];
  return ["bodyweight"];
}

export function exercisesForLocation(location: Location): Exercise[] {
  const allowed = allowedEquipment(location);
  return EXERCISES.filter((e) => allowed.includes(e.equipment));
}
