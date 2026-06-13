"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SERIES_COLORS } from "@/lib/constants";
import { formatNumber, formatPercent } from "@/lib/formatting";
import type { ModelMetricRow } from "@/lib/types";

function tooltipFormatter(value: number | string) {
  return typeof value === "number" ? formatNumber(value, 0) : value;
}

export function AllCitiesForecastChart({
  data,
}: {
  data: Array<{ date: string; dayNameAr: string; forecastOrders: number | null }>;
}) {
  if (!data.length) return null;
  const avg =
    data.reduce((sum, row) => sum + (row.forecastOrders ?? 0), 0) / data.length;
  return (
    <div className="h-[460px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 18, right: 14, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="dayNameAr" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis tick={{ fill: "#10233F", fontSize: 12 }} />
          <Tooltip
            formatter={(value) => tooltipFormatter(value as number)}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload
                ? `${payload[0].payload.dayNameAr} | ${payload[0].payload.date}`
                : ""
            }
          />
          <ReferenceLine y={avg} stroke="#64748B" strokeDasharray="5 5" />
          <Area
            type="monotone"
            dataKey="forecastOrders"
            stroke={SERIES_COLORS["كل المدن"]}
            fill={SERIES_COLORS["كل المدن"]}
            fillOpacity={0.14}
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CityComparisonChart({
  data,
  mode,
}: {
  data: Array<{ date: string; dayNameAr: string; series: string; forecastOrders: number | null }>;
  mode: "values" | "change";
}) {
  const normalized = useMemo<
    Array<{
      date: string;
      dayNameAr: string;
      series: string;
      forecastOrders: number | null;
      changePct?: number | null;
    }>
  >(() => {
    if (mode === "values") return data;
    const bySeries = new Map<string, number>();
    return data.map((row) => {
      if (!bySeries.has(row.series)) {
        bySeries.set(row.series, row.forecastOrders ?? 0);
      }
      const base = bySeries.get(row.series) ?? 0;
      const pct = base === 0 ? null : (((row.forecastOrders ?? 0) - base) / base) * 100;
      return { ...row, changePct: pct };
    });
  }, [data, mode]);

  const grouped = useMemo(() => {
    const map = new Map<string, Record<string, string | number | null>>();
    for (const row of normalized) {
      const key = `${row.date}-${row.dayNameAr}`;
      if (!map.has(key)) {
        map.set(key, { date: row.date, dayNameAr: row.dayNameAr });
      }
      const record = map.get(key)!;
      record[row.series] = mode === "values" ? row.forecastOrders : row.changePct ?? null;
    }
    return Array.from(map.values());
  }, [normalized, mode]);

  return (
    <div className="h-[430px] w-full">
      <ResponsiveContainer>
        <LineChart data={grouped} margin={{ top: 16, right: 14, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="dayNameAr" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis tick={{ fill: "#10233F", fontSize: 12 }} />
          <Tooltip formatter={(value) => (mode === "values" ? tooltipFormatter(value as number) : formatPercent(value as number))} />
          <Legend />
          {Object.entries(SERIES_COLORS)
            .filter(([series]) => series !== "كل المدن" && series !== "مدن أخرى")
            .map(([series, color]) => (
              <Line
                key={series}
                type="monotone"
                dataKey={series}
                name={series}
                stroke={color}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SingleCityAreaChart({
  data,
  color,
}: {
  data: Array<{ date: string; dayNameAr: string; forecastOrders: number | null }>;
  color: string;
}) {
  const avg =
    data.reduce((sum, row) => sum + (row.forecastOrders ?? 0), 0) /
    (data.length || 1);
  return (
    <div className="h-[430px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 18, right: 14, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="dayNameAr" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis tick={{ fill: "#10233F", fontSize: 12 }} />
          <Tooltip
            formatter={(value) => tooltipFormatter(value as number)}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload
                ? `${payload[0].payload.dayNameAr} | ${payload[0].payload.date}`
                : ""
            }
          />
          <ReferenceLine y={avg} stroke="#64748B" strokeDasharray="5 5" />
          <Area
            type="monotone"
            dataKey="forecastOrders"
            stroke={color}
            fill={color}
            fillOpacity={0.15}
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalTotalsChart({
  data,
}: {
  data: Array<{ series: string; weeklyForecastTotal: number | null }>;
}) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer>
        <BarChart layout="vertical" data={data} margin={{ top: 8, right: 28, left: 32, bottom: 8 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis type="category" dataKey="series" tick={{ fill: "#10233F", fontSize: 12 }} width={90} />
          <Tooltip formatter={(value) => tooltipFormatter(value as number)} />
          <Bar dataKey="weeklyForecastTotal" radius={[8, 8, 8, 8]}>
            {data.map((entry) => (
              <Cell key={entry.series} fill={SERIES_COLORS[entry.series] ?? "#94A3B8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionDonutChart({
  data,
}: {
  data: Array<{ series: string; weeklyForecastTotal: number | null }>;
}) {
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={70}
            outerRadius={110}
            dataKey="weeklyForecastTotal"
            nameKey="series"
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.series} fill={SERIES_COLORS[entry.series] ?? "#94A3B8"} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => tooltipFormatter(value as number)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComparisonLineChart({
  data,
}: {
  data: Array<{
    date: string;
    dayNameAr: string;
    allCitiesForecast: number;
    fourCitiesForecast: number;
  }>;
}) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 16, right: 14, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="dayNameAr" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis tick={{ fill: "#10233F", fontSize: 12 }} />
          <Tooltip formatter={(value) => tooltipFormatter(value as number)} />
          <Legend />
          <Line type="monotone" dataKey="allCitiesForecast" name="كل المدن" stroke={SERIES_COLORS["كل المدن"]} strokeWidth={3} />
          <Line type="monotone" dataKey="fourCitiesForecast" name="مجموع المدن الأربع" stroke="#2563EB" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DifferenceBarChart({
  data,
}: {
  data: Array<{ dayNameAr: string; difference: number }>;
}) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="dayNameAr" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis tick={{ fill: "#10233F", fontSize: 12 }} />
          <Tooltip formatter={(value) => tooltipFormatter(value as number)} />
          <Bar dataKey="difference" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.dayNameAr}-${index}`} fill={entry.difference < 0 ? "#DC2626" : "#0F8B8D"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ActualPredictedChart({
  data,
}: {
  data: Array<{ date: string; dayNameAr: string; actualOrders: number | null; forecastOrders: number | null }>;
}) {
  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 16, right: 14, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="dayNameAr" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis tick={{ fill: "#10233F", fontSize: 12 }} />
          <Tooltip formatter={(value) => tooltipFormatter(value as number)} />
          <Legend />
          <Line type="monotone" dataKey="actualOrders" name="Actual" stroke="#10233F" strokeWidth={3} />
          <Line type="monotone" dataKey="forecastOrders" name="Predicted" stroke="#0F8B8D" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ErrorChart({
  data,
  absolute = false,
}: {
  data: Array<{ dayNameAr: string; error: number | null; absoluteError: number | null }>;
  absolute?: boolean;
}) {
  const key = absolute ? "absoluteError" : "error";
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="dayNameAr" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis tick={{ fill: "#10233F", fontSize: 12 }} />
          <Tooltip formatter={(value) => tooltipFormatter(value as number)} />
          <Bar dataKey={key} radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`${entry.dayNameAr}-${index}`}
                fill={absolute ? "#F59E0B" : (entry.error ?? 0) < 0 ? "#DC2626" : "#0F8B8D"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScatterComparisonChart({
  data,
}: {
  data: Array<{ actualOrders: number | null; forecastOrders: number | null }>;
}) {
  const points = data
    .filter((row) => row.actualOrders !== null && row.forecastOrders !== null)
    .map((row) => ({
      actualOrders: row.actualOrders as number,
      forecastOrders: row.forecastOrders as number,
    }));
  const maxValue = Math.max(...points.flatMap((point) => [point.actualOrders, point.forecastOrders]), 0);

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis type="number" dataKey="actualOrders" name="Actual" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis type="number" dataKey="forecastOrders" name="Predicted" tick={{ fill: "#10233F", fontSize: 12 }} />
          <Tooltip formatter={(value) => tooltipFormatter(value as number)} />
          <Scatter data={points} fill="#2563EB" />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: maxValue, y: maxValue }]} stroke="#64748B" strokeDasharray="5 5" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricsBarChart({
  data,
  metricKey,
  baselineKey,
}: {
  data: Array<Record<string, string | number | null>>;
  metricKey: string;
  baselineKey?: string;
}) {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis dataKey="series" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis tick={{ fill: "#10233F", fontSize: 12 }} />
          <Tooltip formatter={(value) => tooltipFormatter(value as number)} />
          <Legend />
          <Bar dataKey={metricKey} name={metricKey}>
            {data.map((entry) => (
              <Cell key={String(entry.series)} fill={SERIES_COLORS[String(entry.series)] ?? "#94A3B8"} />
            ))}
          </Bar>
          {baselineKey ? <Bar dataKey={baselineKey} fill="#CBD5E1" name={baselineKey} /> : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricsScatterChart({
  data,
}: {
  data: ModelMetricRow[];
}) {
  const points = data
    .filter(
      (row) =>
        row.historicalTotalOrders !== null &&
        row.historicalTotalOrders !== undefined &&
        row.testWape !== null &&
        row.testWape !== undefined
    )
    .map((row) => ({
      x: row.historicalTotalOrders as number,
      y: row.testWape as number,
      series: row.series,
    }));
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" name="Historical Total" tick={{ fill: "#10233F", fontSize: 12 }} />
          <YAxis type="number" dataKey="y" name="Test WAPE" tick={{ fill: "#10233F", fontSize: 12 }} />
          <Tooltip formatter={(value) => tooltipFormatter(value as number)} />
          <Scatter data={points} fill="#0F8B8D" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HeatmapGrid({
  rows,
}: {
  rows: Array<{ series: string; dayNameAr: string; forecastOrders: number | null }>;
}) {
  const seriesList = Array.from(new Set(rows.map((row) => row.series)));
  const dayList = Array.from(new Set(rows.map((row) => row.dayNameAr)));
  const maxValue = Math.max(...rows.map((row) => row.forecastOrders ?? 0), 1);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="grid grid-cols-[120px_repeat(7,minmax(64px,1fr))] gap-2">
          <div />
          {dayList.map((day) => (
            <div key={day} className="text-center text-xs font-bold text-muted">
              {day}
            </div>
          ))}
          {seriesList.map((series) => (
            <div key={series} className="contents">
              <div key={`${series}-label`} className="flex items-center text-sm font-bold text-navy">
                {series}
              </div>
              {dayList.map((day) => {
                const cell = rows.find((row) => row.series === series && row.dayNameAr === day);
                const value = cell?.forecastOrders ?? 0;
                const opacity = Math.max(0.12, value / maxValue);
                return (
                  <div
                    key={`${series}-${day}`}
                    className="flex h-16 items-center justify-center rounded-2xl border border-border text-xs font-bold text-navy"
                    style={{ backgroundColor: `rgba(15, 139, 141, ${opacity})` }}
                  >
                    {formatNumber(value, 0)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
