import { ALL_CITIES_LABEL, MAJOR_CITIES, OTHER_CITIES_LABEL } from "@/lib/constants";
import type {
  DashboardDatasets,
  ForecastRow,
  ModelMetricRow,
  ResultRow,
  WeeklySummaryRow,
} from "@/lib/types";

export function getForecastDateRange(rows: ForecastRow[]) {
  if (!rows.length) {
    return { start: null, end: null };
  }
  const ordered = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  return { start: ordered[0].date, end: ordered[ordered.length - 1].date };
}

export function filterForecastRows(rows: ForecastRow[], selectedSeries: string[], startDate?: string, endDate?: string) {
  return rows.filter((row) => {
    if (!selectedSeries.includes(row.series)) {
      return false;
    }
    if (startDate && row.date < startDate) {
      return false;
    }
    if (endDate && row.date > endDate) {
      return false;
    }
    return true;
  });
}

export function sumForecast(rows: ForecastRow[]): number {
  return rows.reduce((sum, row) => sum + (row.forecastOrders ?? 0), 0);
}

export function averageForecast(rows: ForecastRow[]): number | null {
  if (!rows.length) {
    return null;
  }
  return sumForecast(rows) / rows.length;
}

export function getPeakForecastRow(rows: ForecastRow[]): ForecastRow | null {
  if (!rows.length) {
    return null;
  }
  return [...rows].sort((a, b) => (b.forecastOrders ?? 0) - (a.forecastOrders ?? 0))[0];
}

export function getLowestForecastRow(rows: ForecastRow[]): ForecastRow | null {
  if (!rows.length) {
    return null;
  }
  return [...rows].sort((a, b) => (a.forecastOrders ?? 0) - (b.forecastOrders ?? 0))[0];
}

export function summarizeSeries(rows: ForecastRow[], series: string) {
  const seriesRows = rows.filter((row) => row.series === series);
  const peak = getPeakForecastRow(seriesRows);
  const low = getLowestForecastRow(seriesRows);
  return {
    series,
    rows: seriesRows,
    weeklyTotal: sumForecast(seriesRows),
    dailyAverage: averageForecast(seriesRows),
    peak,
    low,
  };
}

export function getCitySummaries(rows: ForecastRow[], cities: readonly string[] = [...MAJOR_CITIES]) {
  return cities.map((city) => summarizeSeries(rows, city));
}

export function getAllCitiesSummary(rows: ForecastRow[]) {
  return summarizeSeries(rows, ALL_CITIES_LABEL);
}

export function getTopCity(rows: ForecastRow[]) {
  const summaries = getCitySummaries(rows);
  return summaries.sort((a, b) => b.weeklyTotal - a.weeklyTotal)[0] ?? null;
}

export function buildDailyComparison(rows: ForecastRow[]) {
  const allCitiesRows = rows.filter((row) => row.series === ALL_CITIES_LABEL);
  const result = allCitiesRows.map((row) => {
    const cityTotal = rows
      .filter((item) => MAJOR_CITIES.includes(item.series as (typeof MAJOR_CITIES)[number]) && item.date === row.date)
      .reduce((sum, item) => sum + (item.forecastOrders ?? 0), 0);
    const allCitiesValue = row.forecastOrders ?? 0;
    const difference = allCitiesValue - cityTotal;
    return {
      date: row.date,
      dayNameAr: row.dayNameAr,
      allCitiesForecast: allCitiesValue,
      fourCitiesForecast: cityTotal,
      difference,
      differencePct: cityTotal === 0 ? null : (difference / cityTotal) * 100,
      otherCitiesForecast: difference >= 0 ? difference : null,
    };
  });
  return result;
}

export function getOtherCitiesWeeklyEstimate(rows: ForecastRow[]): number | null {
  const comparison = buildDailyComparison(rows);
  const total = comparison.reduce((sum, row) => sum + (row.otherCitiesForecast ?? 0), 0);
  return total >= 0 ? total : null;
}

export function addOtherCitiesDistribution(weeklySummary: WeeklySummaryRow[]) {
  const majorRows = weeklySummary.filter((row) =>
    MAJOR_CITIES.includes(row.series as (typeof MAJOR_CITIES)[number])
  );
  const allCities = weeklySummary.find((row) => row.series === ALL_CITIES_LABEL);
  const majorTotal = majorRows.reduce((sum, row) => sum + (row.weeklyForecastTotal ?? 0), 0);
  const allCitiesTotal = allCities?.weeklyForecastTotal ?? null;
  const other = allCitiesTotal !== null ? allCitiesTotal - majorTotal : null;
  if (other !== null && other >= 0) {
    return [...majorRows, { series: OTHER_CITIES_LABEL, weeklyForecastTotal: other } as WeeklySummaryRow];
  }
  return majorRows;
}

export function withMetricImprovements(rows: ModelMetricRow[]) {
  return rows.map((row) => {
    const improvement =
      row.baselineWape !== null && row.baselineWape !== undefined && row.testWape !== null && row.testWape !== undefined
        ? row.baselineWape - row.testWape
        : null;
    const improvementPct =
      improvement !== null && row.baselineWape && row.baselineWape !== 0
        ? (improvement / row.baselineWape) * 100
        : null;
    return { ...row, improvement, improvementPct };
  });
}

export function getBestMetricRows(rows: ModelMetricRow[]) {
  const enriched = withMetricImprovements(rows);
  return {
    bestWape: [...enriched].sort((a, b) => (a.testWape ?? Infinity) - (b.testWape ?? Infinity))[0] ?? null,
    bestMae: [...enriched].sort((a, b) => (a.testMae ?? Infinity) - (b.testMae ?? Infinity))[0] ?? null,
    bestImprovement: [...enriched].sort((a, b) => (b.improvement ?? -Infinity) - (a.improvement ?? -Infinity))[0] ?? null,
    betterThanBaselineCount: enriched.filter((row) => row.betterThanBaseline === "نعم").length,
    needImprovementCount: enriched.filter((row) => (row.testWape ?? Infinity) >= 30).length,
  };
}

export function getSeriesResults(rows: ResultRow[], series: string, datasetType: "Validation" | "Test") {
  return rows
    .filter((row) => row.series === series && row.datasetType === datasetType)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateMae(rows: ResultRow[]) {
  if (!rows.length) {
    return null;
  }
  const total = rows.reduce((sum, row) => sum + Math.abs(row.actualOrders ?? 0 - (row.forecastOrders ?? 0)), 0);
  return total / rows.length;
}

export function executiveInsights(datasets: DashboardDatasets, filteredForecast: ForecastRow[]) {
  const insights: string[] = [];
  const topCity = getTopCity(filteredForecast);
  const allCitiesSummary = getAllCitiesSummary(filteredForecast);
  if (topCity) {
    insights.push(`أعلى مدينة متوقعة خلال الفترة الحالية هي ${topCity.series} بإجمالي ${topCity.weeklyTotal.toLocaleString("en-US")} طلب.`);
  }
  if (allCitiesSummary.peak) {
    insights.push(`أعلى يوم متوقع في موديل كل المدن هو ${allCitiesSummary.peak.date} بقيمة ${(allCitiesSummary.peak.forecastOrders ?? 0).toLocaleString("en-US")} طلب.`);
  }
  const cityDiffs = getCitySummaries(filteredForecast).map((summary) => ({
    city: summary.series,
    volatility: summary.rows.reduce((acc, row, index, list) => {
      if (index === 0) {
        return acc;
      }
      return acc + Math.abs((row.forecastOrders ?? 0) - (list[index - 1].forecastOrders ?? 0));
    }, 0),
  }));
  const mostVolatile = [...cityDiffs].sort((a, b) => b.volatility - a.volatility)[0];
  const mostStable = [...cityDiffs].sort((a, b) => a.volatility - b.volatility)[0];
  if (mostVolatile) {
    insights.push(`أكثر مدينة تُظهر تذبذبًا يوميًا هي ${mostVolatile.city}.`);
  }
  if (mostStable) {
    insights.push(`أكثر مدينة مستقرة خلال الأسبوع هي ${mostStable.city}.`);
  }
  const comparison = buildDailyComparison(filteredForecast);
  const weeklyDifference = comparison.reduce((sum, row) => sum + row.difference, 0);
  insights.push(`الفرق الأسبوعي بين موديل كل المدن ومجموع المدن الأربع يساوي ${weeklyDifference.toLocaleString("en-US")} طلب.`);
  const otherCities = getOtherCitiesWeeklyEstimate(filteredForecast);
  if (otherCities !== null) {
    insights.push(`تقدير مساهمة المدن الأخرى خلال الأسبوع الحالي يبلغ ${otherCities.toLocaleString("en-US")} طلب.`);
  }
  const totalMajor = getCitySummaries(filteredForecast).reduce((sum, row) => sum + row.weeklyTotal, 0);
  const riyadh = summarizeSeries(filteredForecast, "الرياض");
  if (totalMajor > 0) {
    insights.push(`حصة الرياض من إجمالي المدن الأربع تبلغ ${((riyadh.weeklyTotal / totalMajor) * 100).toFixed(2)}%.`);
  }
  return insights;
}
