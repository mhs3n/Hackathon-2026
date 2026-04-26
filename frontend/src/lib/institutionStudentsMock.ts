// Deterministic mock roster for an institution, grouped by academic level.
// Only enabled for INSAT and ENSTAB.

const ENABLED_INSTITUTION_IDS = new Set(["insat", "enstab"]);

export type StudentLevel =
  | "First grade"
  | "Second grade"
  | "Third grade"
  | "Master degree";

export const STUDENT_LEVELS: StudentLevel[] = [
  "First grade",
  "Second grade",
  "Third grade",
  "Master degree",
];

export type StudentStatus = "Active" | "At risk" | "On leave";

export type MockStudent = {
  id: string;
  studentId: string;
  name: string;
  gender: "M" | "F";
  email: string;
  level: StudentLevel;
  enrollmentYear: number;
  averageGrade: number;
  attendanceRate: number;
  status: StudentStatus;
};

export type InstitutionStudentsByLevel = Record<StudentLevel, MockStudent[]>;

// --- deterministic RNG ---
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

const FIRST_NAMES_M = [
  "Ahmed", "Mohamed", "Youssef", "Karim", "Mehdi", "Amine", "Hamza", "Bilel",
  "Nizar", "Skander", "Aymen", "Wael", "Khalil", "Omar", "Anis", "Firas",
  "Iheb", "Walid", "Tarek", "Sami", "Rami", "Hatem", "Marwen", "Selim",
  "Houssem", "Zied", "Achref", "Malek", "Eya", "Nidhal",
];

const FIRST_NAMES_F = [
  "Amira", "Sarra", "Leila", "Mariem", "Yasmine", "Ines", "Rim", "Sirine",
  "Nour", "Fatma", "Aya", "Salma", "Imen", "Wafa", "Rania", "Houda", "Sonia",
  "Asma", "Maha", "Dorra", "Khaoula", "Asrar", "Hela", "Olfa", "Takwa",
  "Cyrine", "Ghada", "Manel", "Nadia", "Bochra",
];

const LAST_NAMES = [
  "Ben Ali", "Trabelsi", "Bouazizi", "Karoui", "Ghariani", "Jelassi", "Mahmoud",
  "Bouheni", "Hamdi", "Ben Salem", "Chaabane", "Sassi", "Charfi", "Zribi",
  "Ben Hamadi", "Bouzid", "Khelifi", "Saidi", "Mejri", "Mansouri", "Belhadj",
  "Ben Amor", "Chebbi", "Gharbi", "Mzoughi", "Riahi", "Souissi", "Toumi",
  "Yahiaoui", "Zoghlami", "Ferchichi", "Hammami", "Khlifi", "Ladhari",
];

// Per-institution roster sizes per level (deterministic, distinct shapes).
const ROSTER_SIZES: Record<string, Record<StudentLevel, number>> = {
  insat: {
    "First grade": 28,
    "Second grade": 24,
    "Third grade": 20,
    "Master degree": 14,
  },
  enstab: {
    "First grade": 22,
    "Second grade": 19,
    "Third grade": 16,
    "Master degree": 11,
  },
};

function pickName(rng: () => number): { name: string; sex: "M" | "F" } {
  const sex: "M" | "F" = rng() < 0.5 ? "M" : "F";
  const pool = sex === "M" ? FIRST_NAMES_M : FIRST_NAMES_F;
  const first = pool[Math.floor(rng() * pool.length)];
  const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  return { name: `${first} ${last}`, sex };
}

export function isStudentsPanelEnabled(institutionId: string | undefined | null): boolean {
  if (!institutionId) return false;
  return ENABLED_INSTITUTION_IDS.has(institutionId.toLowerCase());
}

export function deriveInstitutionStudents(
  institutionId: string,
): InstitutionStudentsByLevel | null {
  const key = institutionId.toLowerCase();
  if (!ENABLED_INSTITUTION_IDS.has(key)) return null;

  const sizes = ROSTER_SIZES[key];
  const result: InstitutionStudentsByLevel = {
    "First grade": [],
    "Second grade": [],
    "Third grade": [],
    "Master degree": [],
  };

  // shared RNG seeded by institution to keep 6-digit student IDs unique across levels
  const idRng = mulberry32(hashSeed(`${key}::studentIds`));
  const usedIds = new Set<string>();
  const nextStudentId = (): string => {
    for (let i = 0; i < 50; i += 1) {
      const num = Math.floor(idRng() * 900000) + 100000; // 100000-999999
      const sid = String(num);
      if (!usedIds.has(sid)) {
        usedIds.add(sid);
        return sid;
      }
    }
    // fallback (extremely unlikely)
    return String(Math.floor(idRng() * 900000) + 100000);
  };

  const currentYear = new Date().getFullYear();
  const yearsBack: Record<StudentLevel, number> = {
    "First grade": 0,
    "Second grade": 1,
    "Third grade": 2,
    "Master degree": 3,
  };

  STUDENT_LEVELS.forEach((level) => {
    const count = sizes[level];
    const rng = mulberry32(hashSeed(`${key}::${level}`));
    const usedNames = new Set<string>();
    for (let i = 0; i < count; i += 1) {
      let attempt = pickName(rng);
      let guard = 0;
      while (usedNames.has(attempt.name) && guard < 10) {
        attempt = pickName(rng);
        guard += 1;
      }
      usedNames.add(attempt.name);

      const averageGrade = Number((8 + rng() * 10).toFixed(2)); // 8.00 - 18.00
      const attendanceRate = Math.round(60 + rng() * 40); // 60 - 100
      const status: StudentStatus =
        averageGrade < 10 || attendanceRate < 70
          ? "At risk"
          : rng() < 0.04
          ? "On leave"
          : "Active";

      const slug = attempt.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]+/g, ".")
        .replace(/^\.|\.$/g, "");

      result[level].push({
        id: `${key}_${level.replace(/\s+/g, "_").toLowerCase()}_${i + 1}`,
        studentId: nextStudentId(),
        name: attempt.name,
        gender: attempt.sex,
        email: `${slug}@${key}.ucar.tn`,
        level,
        enrollmentYear: currentYear - yearsBack[level],
        averageGrade,
        attendanceRate,
        status,
      });
    }
    result[level].sort((a, b) => a.name.localeCompare(b.name));
  });

  return result;
}

export function totalStudents(byLevel: InstitutionStudentsByLevel): number {
  return STUDENT_LEVELS.reduce((sum, lvl) => sum + byLevel[lvl].length, 0);
}
