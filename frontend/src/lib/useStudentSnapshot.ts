import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { usePeriod } from "../period/PeriodContext";
import { fetchStudentDashboard } from "./api";
import { deriveStudent, type StudentDerived } from "./studentDerived";
import type { StudentDashboardView } from "../types";
import type { ReportingPeriod } from "./api";

export type UseStudentSnapshotResult = {
  snapshot: StudentDashboardView | null;
  derived: StudentDerived | null;
  error: string | null;
  loading: boolean;
  activePeriod: ReportingPeriod | null;
};

// --- Tiny deterministic RNG (kept local to avoid cycles with studentDerived) ---
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Apply a deterministic per-period shift to the live snapshot so that selecting
 * an older period shows weaker indicators (grade ↓, attendance ↓, risk ↑).
 * The latest period in the list is treated as "current" and returns the
 * snapshot unchanged. Jitter is seeded by (studentId + periodId) so reloads
 * remain consistent.
 */
function modulateSnapshot(
  snapshot: StudentDashboardView,
  periods: ReportingPeriod[],
  periodId: string,
  seedKey: string,
): StudentDashboardView {
  if (!periodId || periods.length === 0) return snapshot;
  const idx = periods.findIndex((p) => p.id === periodId);
  if (idx === -1) return snapshot;
  const latest = periods.length - 1;
  const offset = latest - idx; // 0 → current, larger → older
  if (offset === 0) return snapshot;

  const rng = mulberry32(hashSeed(`${seedKey}::${periodId}`));
  const gradeShift = -offset * 0.7 + (rng() - 0.5) * 1.4;
  const attShift = -offset * 3 + (rng() - 0.5) * 6;
  const riskShift = offset * 5 + (rng() - 0.5) * 8;

  return {
    ...snapshot,
    averageGrade: +clamp(snapshot.averageGrade + gradeShift, 0, 20).toFixed(1),
    attendance: Math.round(clamp(snapshot.attendance + attShift, 0, 100)),
    riskScore: Math.round(clamp(snapshot.riskScore + riskShift, 0, 100)),
  };
}

export function useStudentSnapshot(): UseStudentSnapshotResult {
  const { user } = useAuth();
  const { periods, periodId } = usePeriod();
  const [rawSnapshot, setRawSnapshot] = useState<StudentDashboardView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.studentProfileId) return;
    let active = true;
    fetchStudentDashboard(user.studentProfileId)
      .then((p) => {
        if (active) {
          setRawSnapshot(p);
          setError(null);
        }
      })
      .catch((err: Error) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [user?.studentProfileId]);

  const seedKey = user?.studentProfileId ?? rawSnapshot?.studentName ?? "student";

  const snapshot = useMemo(() => {
    if (!rawSnapshot) return null;
    return modulateSnapshot(rawSnapshot, periods, periodId, seedKey);
  }, [rawSnapshot, periods, periodId, seedKey]);

  const derived = useMemo(
    () => (snapshot ? deriveStudent(snapshot, `${seedKey}::${periodId || "current"}`) : null),
    [snapshot, seedKey, periodId],
  );

  const activePeriod = useMemo(
    () => periods.find((p) => p.id === periodId) ?? null,
    [periods, periodId],
  );

  return {
    snapshot,
    derived,
    error,
    loading: !snapshot && !error,
    activePeriod,
  };
}
