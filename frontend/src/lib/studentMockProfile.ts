import type { StudentDashboardView } from "../types";

// --- deterministic RNG (same shape as studentDerived) ---
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FEMALE_HINTS = [
  "amira", "sarra", "leila", "mariem", "yasmine", "ines", "rim", "sirine",
  "nour", "fatma", "aya", "salma", "imen", "wafa", "rania", "houda", "sonia",
];

const TUNISIAN_CITIES = [
  "Tunis", "Ariana", "Ben Arous", "La Marsa", "Bizerte", "Nabeul", "Sousse",
  "Monastir", "Mahdia", "Sfax", "Kairouan", "Gafsa", "Gabès", "Médenine",
  "Tozeur", "Béja", "Jendouba", "Kasserine", "Sidi Bouzid",
];

const STREET_NAMES = [
  "Rue de la République", "Avenue Habib Bourguiba", "Rue de Carthage",
  "Avenue Mohamed V", "Rue Ibn Khaldoun", "Avenue de la Liberté",
  "Rue Hédi Chaker", "Rue Farhat Hached", "Avenue de Paris",
];

const DIRECTOR_NAMES = [
  "Pr. Mohamed Trabelsi", "Pr. Faouzia Charfi", "Pr. Anis Ben Hamadi",
  "Pr. Nadia Zribi", "Pr. Hichem Karoui", "Pr. Samia Mahmoud",
  "Pr. Karim Bouazizi", "Pr. Olfa Ben Amor",
];

export type StudentRegistrationMock = {
  dateOfBirth: string; // dd/mm/yyyy
  placeOfBirth: string;
  nationality: string;
  cin: string; // 8 digits
  sex: "M" | "F";
  address: string;
  specialty: string;
  registrationDate: string; // dd/mm/yyyy
  directorName: string;
  registrationStatus: "Active" | "Suspended";
  studentCode: string; // 6 digits
  level: "First grade" | "Second grade" | "Third grade";
};

function inferSex(fullName: string): "M" | "F" {
  const first = (fullName.split(/\s+/)[0] ?? "").toLowerCase();
  return FEMALE_HINTS.some((h) => first.startsWith(h)) ? "F" : "M";
}

function deriveSpecialty(program: string | null | undefined): string {
  if (!program) return "Tronc commun";
  const p = program.toLowerCase();
  if (p.includes("computer") || p.includes("inform")) return "Génie Informatique - Software";
  if (p.includes("indus")) return "Systèmes Industriels - Automatique";
  if (p.includes("math")) return "Mathématiques Appliquées";
  if (p.includes("electr") || p.includes("élec")) return "Génie Électrique";
  if (p.includes("civil")) return "Génie Civil";
  if (p.includes("mech") || p.includes("méca")) return "Génie Mécanique";
  return program;
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

function pickAcademicYearStart(academicYear: string | null | undefined): string {
  // "2025-2026" → registration around 15/09/2025
  if (academicYear && /^\d{4}-\d{4}$/.test(academicYear)) {
    return `15/09/${academicYear.slice(0, 4)}`;
  }
  return `15/09/${new Date().getFullYear()}`;
}

export function deriveRegistrationMock(snapshot: StudentDashboardView, seedKey: string): StudentRegistrationMock {
  const rng = mulberry32(hashSeed(`${seedKey}::reg::${snapshot.studentCode ?? ""}`));

  // Birth year: derive from level label so 1st Year ~ 19yo, 3rd Year ~ 21yo
  const levelGuess = (snapshot.levelLabel ?? "").toLowerCase();
  const ageGuess = levelGuess.includes("1st") ? 19
    : levelGuess.includes("2nd") ? 20
    : levelGuess.includes("3rd") ? 21
    : levelGuess.includes("4th") || levelGuess.includes("master") ? 22
    : 20;
  const refYear = new Date().getFullYear() - ageGuess;
  const dobDay = 1 + Math.floor(rng() * 28);
  const dobMonth = 1 + Math.floor(rng() * 12);
  const dobYear = refYear + Math.floor((rng() - 0.5) * 2); // +/- 1 year jitter

  const cinFirst = 1 + Math.floor(rng() * 9);
  const cinRest = Math.floor(rng() * 10_000_000);
  const cin = `${cinFirst}${pad(cinRest, 7)}`;

  const placeOfBirth = TUNISIAN_CITIES[Math.floor(rng() * TUNISIAN_CITIES.length)];
  const street = STREET_NAMES[Math.floor(rng() * STREET_NAMES.length)];
  const streetNo = 1 + Math.floor(rng() * 120);
  const addressCity = snapshot.institutionRegion ?? TUNISIAN_CITIES[Math.floor(rng() * TUNISIAN_CITIES.length)];
  const postal = 1000 + Math.floor(rng() * 8999);
  const address = `${streetNo} ${street}, ${pad(postal, 4)} ${addressCity}`;

  const directorName = DIRECTOR_NAMES[Math.floor(rng() * DIRECTOR_NAMES.length)];

  // 6-digit student code (first digit not zero)
  const codeFirst = 1 + Math.floor(rng() * 9);
  const codeRest = Math.floor(rng() * 100_000);
  const studentCode = `${codeFirst}${pad(codeRest, 5)}`;

  const levelOptions: StudentRegistrationMock["level"][] = ["First grade", "Second grade", "Third grade"];
  const level = levelOptions[Math.floor(rng() * levelOptions.length)];

  return {
    dateOfBirth: `${pad(dobDay, 2)}/${pad(dobMonth, 2)}/${dobYear}`,
    placeOfBirth,
    nationality: "Tunisienne",
    cin,
    sex: inferSex(snapshot.studentName),
    address,
    specialty: deriveSpecialty(snapshot.programName),
    registrationDate: pickAcademicYearStart(snapshot.academicYear),
    directorName,
    registrationStatus: "Active",
    studentCode,
    level,
  };
}
