import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { fetchPeriods, type ReportingPeriod } from "../lib/api";

const STORAGE_KEY = "ucar-insight-period";

type PeriodCtx = {
  periods: ReportingPeriod[];
  periodId: string;
  setPeriodId: (id: string) => void;
  loading: boolean;
};

const Ctx = createContext<PeriodCtx | undefined>(undefined);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [periodId, setPeriodIdState] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPeriods()
      .then((p) => {
        if (cancelled) return;
        setPeriods(p);
        const stored = localStorage.getItem(STORAGE_KEY);
        const valid = stored && p.some((x) => x.id === stored) ? stored : p[p.length - 1]?.id ?? "";
        setPeriodIdState(valid);
      })
      .catch(() => setPeriods([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const setPeriodId = (id: string) => {
    setPeriodIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  return <Ctx.Provider value={{ periods, periodId, setPeriodId, loading }}>{children}</Ctx.Provider>;
}

export function usePeriod() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePeriod must be used inside <PeriodProvider>");
  return ctx;
}
