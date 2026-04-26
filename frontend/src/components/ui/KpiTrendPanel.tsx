import { useEffect, useMemo, useState } from "react";

import { fetchKpiHistory } from "../../lib/api";
import type { KpiHistoryResponse } from "../../types";
import { KpiForecastChart, type ForecastPoint } from "../charts/KpiCharts";

type Props = {
  institutionId: string;
  domain: string;
  metricKey: string;
  metricLabel: string;
  color?: string;
};

export function KpiTrendPanel({ institutionId, domain, metricKey, metricLabel, color = "#1d5394" }: Props) {
  const [history, setHistory] = useState<KpiHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchKpiHistory(institutionId, domain)
      .then((data) => {
        if (active) setHistory(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [institutionId, domain]);

  const chartData = useMemo<ForecastPoint[]>(() => {
    if (!history) return [];
    const series = history.series.find((s) => s.metric === metricKey);
    if (!series) return [];
    const past: ForecastPoint[] = series.values.map((v, i) => ({
      name: history.periods[i] ?? `P${i + 1}`,
      actual: v,
    }));
    // Bridge actual -> forecast so the dashed line connects visually
    if (past.length > 0) {
      past[past.length - 1] = { ...past[past.length - 1], forecast: past[past.length - 1].actual };
    }
    past.push({ name: history.forecastPeriod, forecast: series.forecast });
    return past;
  }, [history, metricKey]);

  const series = history?.series.find((s) => s.metric === metricKey);
  const trendDelta = useMemo(() => {
    if (!series) return null;
    const last = series.values[series.values.length - 1];
    const delta = series.forecast - last;
    return { delta, last, next: series.forecast };
  }, [series]);

  return (
    <section className="panel">
      <div className="panel__header">
        <h3>{metricLabel} — trend &amp; AI forecast</h3>
        <span>{trendDelta ? `Next period: ${trendDelta.next.toFixed(1)}` : "Loading..."}</span>
      </div>
      {error ? (
        <p style={{ color: "#e85d6c", fontSize: 13 }}>Could not load history: {error}</p>
      ) : chartData.length === 0 ? (
        <p style={{ color: "#60758a", fontSize: 13 }}>Loading historical data...</p>
      ) : (
        <>
          <KpiForecastChart data={chartData} color={color} />
          {trendDelta && (
            <p style={{ fontSize: 12, color: "#60758a", margin: "8px 0 0 0" }}>
              Linear regression projects{" "}
              <strong style={{ color: trendDelta.delta >= 0 ? "#27ae60" : "#e85d6c" }}>
                {trendDelta.delta >= 0 ? "+" : ""}
                {trendDelta.delta.toFixed(2)}
              </strong>{" "}
              vs the latest period ({trendDelta.last.toFixed(1)}).
            </p>
          )}
        </>
      )}
    </section>
  );
}
