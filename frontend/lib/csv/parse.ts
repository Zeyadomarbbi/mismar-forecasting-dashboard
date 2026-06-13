import Papa from "papaparse";
import {
  DatasetKey,
  ForecastRow,
  ModelMetricRow,
  ResultRow,
  TrainingSummaryRow,
  WeeklySummaryRow,
} from "@/lib/types";
import { arabicWeekdayFromDate } from "@/lib/formatting";
import {
  forecastSchema,
  metricsSchema,
  resultSchema,
  trainingSummarySchema,
  weeklySummarySchema,
} from "@/lib/validation/schemas";

type RawRow = Record<string, string | undefined>;

const aliases = {
  series: ["السلسلة", "المدينة", "Series", "City"],
  date: ["اليوم", "التاريخ", "Date", "ds"],
  dayName: ["اسم اليوم", "day_name", "Day Name"],
  forecast: ["الطلبات المتوقعة", "Forecast", "Predicted"],
  actual: ["الطلبات الفعلية", "Actual"],
  datasetType: ["نوع البيانات", "Type"],
  forecastType: ["نوع التوقع", "Type"],
  error: ["الخطأ", "Error"],
  absoluteError: ["الخطأ المطلق", "Absolute Error"],
  forecastStart: ["بداية التوقع", "بداية_التوقع", "Forecast Start"],
  forecastEnd: ["نهاية التوقع", "نهاية_التوقع", "Forecast End"],
  weeklyForecastTotal: ["إجمالي توقع الأسبوع", "إجمالي_الطلبات_المتوقعة", "إجمالي الطلبات المتوقعة"],
  dailyAverage: ["متوسط_الطلبات_اليومي", "متوسط الطلبات اليومي", "متوسط الطلبات اليومية"],
  dailyMax: ["أعلى_توقع_يومي", "أعلى توقع يومي"],
  dailyMin: ["أقل_توقع_يومي", "أقل توقع يومي"],
  firstDate: ["أول تاريخ"],
  lastActualDate: ["آخر تاريخ فعلي"],
  daysCount: ["عدد الأيام"],
  historicalTotalOrders: ["إجمالي الطلبات"],
  historicalDailyAverage: ["متوسط الطلبات اليومية"],
  bestEpoch: ["أفضل Epoch", "عدد Epochs النهائي"],
  validationMae: ["Validation_MAE", "Validation MAE"],
  validationRmse: ["Validation_RMSE", "Validation RMSE"],
  validationWape: ["Validation_WAPE_Percent", "Validation WAPE"],
  testMae: ["Test_MAE", "Test MAE"],
  testRmse: ["Test_RMSE", "Test RMSE"],
  testWape: ["Test_WAPE_Percent", "Test WAPE"],
  testBias: ["Test_Bias_Percent", "Bias", "Test Bias"],
  baselineMae: ["Baseline_MAE", "Baseline MAE"],
  baselineRmse: ["Baseline_RMSE", "Baseline RMSE"],
  baselineWape: ["Baseline_WAPE_Percent", "Baseline WAPE"],
  betterThanBaseline: ["أفضل من Baseline", "Better Than Baseline"],
  trainingStatus: ["حالة التدريب"],
  finalEpochs: ["عدد Epochs النهائي", "Final Epochs"],
} as const;

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim();
}

function normalizeValue(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateString(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function getField(row: RawRow, names: readonly string[]): string | null {
  for (const name of names) {
    const value = row[name];
    const normalized = normalizeValue(value);
    if (normalized !== null) {
      return normalized;
    }
  }
  return null;
}

export function parseCsvRows(content: string): RawRow[] {
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
    transform(value) {
      return value.replace(/^\uFEFF/, "").trim();
    },
  });
  return parsed.data as RawRow[];
}

export function parseForecastRows(content: string): { rows: ForecastRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const rows = parseCsvRows(content)
    .map((row, index) => {
      const parsed = forecastSchema.safeParse({
        series: getField(row, aliases.series),
        date: parseDateString(getField(row, aliases.date)),
        dayNameAr:
          getField(row, aliases.dayName) ??
          arabicWeekdayFromDate(parseDateString(getField(row, aliases.date)) ?? ""),
        forecastOrders: parseNumber(getField(row, aliases.forecast)),
        forecastType: getField(row, aliases.forecastType),
        forecastStart: parseDateString(getField(row, aliases.forecastStart)),
        forecastEnd: parseDateString(getField(row, aliases.forecastEnd)),
        weeklyForecastTotal: parseNumber(getField(row, aliases.weeklyForecastTotal)),
      });
      if (!parsed.success) {
        warnings.push(`forecast row ${index + 1}: invalid structure`);
        return null;
      }
      return parsed.data;
    })
    .filter((row): row is ForecastRow => row !== null);
  return { rows, warnings };
}

export function parseWeeklySummaryRows(content: string): { rows: WeeklySummaryRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const rows = parseCsvRows(content)
    .map((row, index) => {
      const parsed = weeklySummarySchema.safeParse({
        series: getField(row, aliases.series),
        forecastStart: parseDateString(getField(row, aliases.forecastStart)),
        forecastEnd: parseDateString(getField(row, aliases.forecastEnd)),
        weeklyForecastTotal: parseNumber(getField(row, aliases.weeklyForecastTotal)),
        dailyAverage: parseNumber(getField(row, aliases.dailyAverage)),
        dailyMax: parseNumber(getField(row, aliases.dailyMax)),
        dailyMin: parseNumber(getField(row, aliases.dailyMin)),
      });
      if (!parsed.success) {
        warnings.push(`weekly summary row ${index + 1}: invalid structure`);
        return null;
      }
      return parsed.data;
    })
    .filter((row): row is WeeklySummaryRow => row !== null);
  return { rows, warnings };
}

export function parseResultRows(content: string): { rows: ResultRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const rows = parseCsvRows(content)
    .map((row, index) => {
      const parsed = resultSchema.safeParse({
        series: getField(row, aliases.series),
        datasetType: getField(row, aliases.datasetType),
        date: parseDateString(getField(row, aliases.date)),
        dayNameAr:
          getField(row, aliases.dayName) ??
          arabicWeekdayFromDate(parseDateString(getField(row, aliases.date)) ?? ""),
        actualOrders: parseNumber(getField(row, aliases.actual)),
        forecastOrders: parseNumber(getField(row, aliases.forecast)),
        error: parseNumber(getField(row, aliases.error)),
        absoluteError: parseNumber(getField(row, aliases.absoluteError)),
      });
      if (!parsed.success) {
        warnings.push(`result row ${index + 1}: invalid structure`);
        return null;
      }
      return parsed.data;
    })
    .filter((row): row is ResultRow => row !== null);
  return { rows, warnings };
}

export function parseMetricRows(content: string): { rows: ModelMetricRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const rows = parseCsvRows(content)
    .map((row, index) => {
      const parsed = metricsSchema.safeParse({
        series: getField(row, aliases.series),
        firstDate: parseDateString(getField(row, aliases.firstDate)),
        lastActualDate: parseDateString(getField(row, aliases.lastActualDate)),
        daysCount: parseNumber(getField(row, aliases.daysCount)),
        historicalTotalOrders: parseNumber(getField(row, aliases.historicalTotalOrders)),
        historicalDailyAverage: parseNumber(getField(row, aliases.historicalDailyAverage)),
        bestEpoch: parseNumber(getField(row, aliases.bestEpoch)),
        validationMae: parseNumber(getField(row, aliases.validationMae)),
        validationRmse: parseNumber(getField(row, aliases.validationRmse)),
        validationWape: parseNumber(getField(row, aliases.validationWape)),
        testMae: parseNumber(getField(row, aliases.testMae)),
        testRmse: parseNumber(getField(row, aliases.testRmse)),
        testWape: parseNumber(getField(row, aliases.testWape)),
        testBias: parseNumber(getField(row, aliases.testBias)),
        baselineMae: parseNumber(getField(row, aliases.baselineMae)),
        baselineRmse: parseNumber(getField(row, aliases.baselineRmse)),
        baselineWape: parseNumber(getField(row, aliases.baselineWape)),
        betterThanBaseline: getField(row, aliases.betterThanBaseline),
      });
      if (!parsed.success) {
        warnings.push(`metric row ${index + 1}: invalid structure`);
        return null;
      }
      return parsed.data;
    })
    .filter((row): row is ModelMetricRow => row !== null);
  return { rows, warnings };
}

export function parseTrainingSummaryRows(content: string): { rows: TrainingSummaryRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const rows = parseCsvRows(content)
    .map((row, index) => {
      const parsed = trainingSummarySchema.safeParse({
        series: getField(row, aliases.series),
        trainingStatus: getField(row, aliases.trainingStatus),
        lastActualDate: parseDateString(getField(row, aliases.lastActualDate)),
        forecastStart: parseDateString(getField(row, aliases.forecastStart)),
        forecastEnd: parseDateString(getField(row, aliases.forecastEnd)),
        weeklyForecastTotal: parseNumber(getField(row, aliases.weeklyForecastTotal)),
        finalEpochs: parseNumber(getField(row, aliases.finalEpochs)),
      });
      if (!parsed.success) {
        warnings.push(`training summary row ${index + 1}: invalid structure`);
        return null;
      }
      return parsed.data;
    })
    .filter((row): row is TrainingSummaryRow => row !== null);
  return { rows, warnings };
}

export function countMissingValues(content: string): number {
  const rows = parseCsvRows(content);
  return rows.reduce((sum, row) => {
    return sum + Object.values(row).filter((value) => normalizeValue(value) === null).length;
  }, 0);
}

export function countDuplicateKeys(
  dataset: DatasetKey,
  rows: ForecastRow[] | ResultRow[] | WeeklySummaryRow[] | ModelMetricRow[] | TrainingSummaryRow[]
): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of rows) {
    let key = "";
    if ("datasetType" in row) {
      key = `${row.series}|${row.datasetType}|${row.date}`;
    } else if ("forecastOrders" in row && "date" in row) {
      key = `${row.series}|${row.date}`;
    } else {
      key = row.series;
    }
    if (seen.has(key)) {
      duplicates += 1;
    } else {
      seen.add(key);
    }
  }
  return duplicates;
}
