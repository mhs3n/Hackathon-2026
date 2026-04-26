import { useEffect, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { usePeriod } from "../period/PeriodContext";
import { fetchInstitutionDashboard } from "./api";
import type { InstitutionDashboardView } from "../types";

export function useInstitutionDashboard() {
  const { user } = useAuth();
  const { periodId } = usePeriod();
  const [dashboard, setDashboard] = useState<InstitutionDashboardView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.institutionId || !periodId) {
      return;
    }
    let isActive = true;
    fetchInstitutionDashboard(user.institutionId, periodId)
      .then((payload) => {
        if (isActive) {
          setDashboard(payload);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (isActive) setError(err.message);
      });
    return () => {
      isActive = false;
    };
  }, [user?.institutionId, periodId]);

  return { dashboard, error };
}
