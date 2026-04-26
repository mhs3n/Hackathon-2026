import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETTE = ["#1d5394", "#2f86c8", "#7dbce8", "#f4b740", "#e85d6c", "#27ae60", "#9b59b6", "#16a085"];

export type SeriesPoint = { name: string; value: number };

export function KpiBarChart({ data, color = "#1d5394" }: { data: SeriesPoint[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3eaf3" />
        <XAxis dataKey="name" stroke="#60758a" fontSize={11} />
        <YAxis stroke="#60758a" fontSize={11} />
        <Tooltip cursor={{ fill: "rgba(29,83,148,0.06)" }} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function KpiLineChart({ data, color = "#1d5394" }: { data: SeriesPoint[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3eaf3" />
        <XAxis dataKey="name" stroke="#60758a" fontSize={11} />
        <YAxis stroke="#60758a" fontSize={11} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function KpiPieChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={2}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={28} iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function KpiRadialGauge({ value, label, color = "#1d5394" }: { value: number; label: string; color?: string }) {
  const data = [{ name: label, value, fill: color }];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadialBarChart innerRadius="65%" outerRadius="100%" data={data} startAngle={210} endAngle={-30}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar background dataKey="value" cornerRadius={20} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight={700} fill="#13263b">
          {value}%
        </text>
        <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#60758a">
          {label}
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

export type ForecastPoint = {
  name: string;
  actual?: number;
  forecast?: number;
};

export function KpiForecastChart({
  data,
  color = "#1d5394",
  forecastColor = "#f4b740",
}: {
  data: ForecastPoint[];
  color?: string;
  forecastColor?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3eaf3" />
        <XAxis dataKey="name" stroke="#60758a" fontSize={11} />
        <YAxis stroke="#60758a" fontSize={11} />
        <Tooltip />
        <Legend verticalAlign="top" height={24} iconSize={10} />
        <Line
          type="monotone"
          name="Actual"
          dataKey="actual"
          stroke={color}
          strokeWidth={3}
          dot={{ r: 4 }}
          connectNulls
        />
        <Line
          type="monotone"
          name="AI Forecast"
          dataKey="forecast"
          stroke={forecastColor}
          strokeWidth={3}
          strokeDasharray="6 4"
          dot={{ r: 5, stroke: forecastColor, strokeWidth: 2, fill: "#fff" }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function KpiRadarChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#d7e2ee" />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "#60758a" }} />
        <PolarRadiusAxis tick={{ fontSize: 10, fill: "#60758a" }} />
        <Radar name="Value" dataKey="value" stroke="#1d5394" fill="#1d5394" fillOpacity={0.35} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
