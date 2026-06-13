import "server-only";

import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";
import { DATASET_FILES } from "@/lib/constants";
import type {
  DashboardDatasets,
  DataQualitySummary,
  DatasetKey,
  DatasetWarning,
  ForecastRow,
  ModelMetricRow,
  ResultRow,
  TrainingSummaryRow,
  WeeklySummaryRow,
} from "@/lib/types";
import {
  countDuplicateKeys,
  countMissingValues,
  parseForecastRows,
  parseMetricRows,
  parseResultRows,
  parseTrainingSummaryRows,
  parseWeeklySummaryRows,
} from "@/lib/csv/parse";

function publicDataPath(fileName: string): string {
  return path.join(process.cwd(), "public", "data", fileName);
}

async function readFileOrNull(fileName: string): Promise<string | null> {
  try {
    return await fs.readFile(publicDataPath(fileName), "utf-8");
  } catch {
    return null;
  }
}

function qualityRow(
  dataset: DatasetKey,
  fileName: string,
  loaded: boolean,
  rowCount: number,
  columnCount: number,
  missingValues: number,
  duplicateRows: number,
  invalidDates: number,
  negativeForecasts: number
): DataQualitySummary {
  return {
    dataset,
    fileName,
    loaded,
    rowCount,
    columnCount,
    missingValues,
    duplicateRows,
    invalidDates,
    negativeForecasts,
  };
}

export const loadDashboardDatasets = cache(async (): Promise<DashboardDatasets> => {
  const warnings: DatasetWarning[] = [];
  const quality: DataQualitySummary[] = [];
  const loadedFiles = {
    forecast: null,
    presentation: null,
    weeklySummary: null,
    validation: null,
    test: null,
    metrics: null,
    trainingSummary: null,
  } as Record<DatasetKey, string | null>;

  const forecastContent = await readFileOrNull(DATASET_FILES.forecast);
  const presentationContent = await readFileOrNull(DATASET_FILES.presentation);
  const weeklySummaryContent = await readFileOrNull(DATASET_FILES.weeklySummary);
  const validationContent = await readFileOrNull(DATASET_FILES.validation);
  const testContent = await readFileOrNull(DATASET_FILES.test);
  const metricsContent = await readFileOrNull(DATASET_FILES.metrics);
  const trainingSummaryContent = await readFileOrNull(DATASET_FILES.trainingSummary);

  const markMissing = (dataset: DatasetKey, fileName: string) => {
    warnings.push({ dataset, level: "error", message: `الملف ${fileName} غير موجود داخل public/data.` });
    quality.push(qualityRow(dataset, fileName, false, 0, 0, 0, 0, 0, 0));
  };

  let forecast: ForecastRow[] = [];
  let presentation: ForecastRow[] = [];
  let weeklySummary: WeeklySummaryRow[] = [];
  let validation: ResultRow[] = [];
  let test: ResultRow[] = [];
  let metrics: ModelMetricRow[] = [];
  let trainingSummary: TrainingSummaryRow[] = [];

  if (forecastContent) {
    loadedFiles.forecast = DATASET_FILES.forecast;
    const parsed = parseForecastRows(forecastContent);
    forecast = parsed.rows;
    warnings.push(...parsed.warnings.map((message) => ({ dataset: "forecast" as const, level: "warning" as const, message })));
    quality.push(
      qualityRow(
        "forecast",
        DATASET_FILES.forecast,
        true,
        forecast.length,
        forecast.length ? Object.keys(forecast[0]).length : 0,
        countMissingValues(forecastContent),
        countDuplicateKeys("forecast", forecast),
        forecast.filter((row) => !row.date).length,
        forecast.filter((row) => (row.forecastOrders ?? 0) < 0).length
      )
    );
  } else {
    markMissing("forecast", DATASET_FILES.forecast);
  }

  if (presentationContent) {
    loadedFiles.presentation = DATASET_FILES.presentation;
    const parsed = parseForecastRows(presentationContent);
    presentation = parsed.rows;
    warnings.push(...parsed.warnings.map((message) => ({ dataset: "presentation" as const, level: "warning" as const, message })));
    quality.push(
      qualityRow(
        "presentation",
        DATASET_FILES.presentation,
        true,
        presentation.length,
        presentation.length ? Object.keys(presentation[0]).length : 0,
        countMissingValues(presentationContent),
        countDuplicateKeys("presentation", presentation),
        presentation.filter((row) => !row.date).length,
        presentation.filter((row) => (row.forecastOrders ?? 0) < 0).length
      )
    );
  } else {
    markMissing("presentation", DATASET_FILES.presentation);
  }

  if (weeklySummaryContent) {
    loadedFiles.weeklySummary = DATASET_FILES.weeklySummary;
    const parsed = parseWeeklySummaryRows(weeklySummaryContent);
    weeklySummary = parsed.rows;
    warnings.push(...parsed.warnings.map((message) => ({ dataset: "weeklySummary" as const, level: "warning" as const, message })));
    quality.push(
      qualityRow(
        "weeklySummary",
        DATASET_FILES.weeklySummary,
        true,
        weeklySummary.length,
        weeklySummary.length ? Object.keys(weeklySummary[0]).length : 0,
        countMissingValues(weeklySummaryContent),
        countDuplicateKeys("weeklySummary", weeklySummary),
        weeklySummary.filter((row) => !row.forecastStart || !row.forecastEnd).length,
        0
      )
    );
  } else {
    markMissing("weeklySummary", DATASET_FILES.weeklySummary);
  }

  if (validationContent) {
    loadedFiles.validation = DATASET_FILES.validation;
    const parsed = parseResultRows(validationContent);
    validation = parsed.rows;
    warnings.push(...parsed.warnings.map((message) => ({ dataset: "validation" as const, level: "warning" as const, message })));
    quality.push(
      qualityRow(
        "validation",
        DATASET_FILES.validation,
        true,
        validation.length,
        validation.length ? Object.keys(validation[0]).length : 0,
        countMissingValues(validationContent),
        countDuplicateKeys("validation", validation),
        validation.filter((row) => !row.date).length,
        0
      )
    );
  } else {
    markMissing("validation", DATASET_FILES.validation);
  }

  if (testContent) {
    loadedFiles.test = DATASET_FILES.test;
    const parsed = parseResultRows(testContent);
    test = parsed.rows;
    warnings.push(...parsed.warnings.map((message) => ({ dataset: "test" as const, level: "warning" as const, message })));
    quality.push(
      qualityRow(
        "test",
        DATASET_FILES.test,
        true,
        test.length,
        test.length ? Object.keys(test[0]).length : 0,
        countMissingValues(testContent),
        countDuplicateKeys("test", test),
        test.filter((row) => !row.date).length,
        0
      )
    );
  } else {
    markMissing("test", DATASET_FILES.test);
  }

  if (metricsContent) {
    loadedFiles.metrics = DATASET_FILES.metrics;
    const parsed = parseMetricRows(metricsContent);
    metrics = parsed.rows;
    warnings.push(...parsed.warnings.map((message) => ({ dataset: "metrics" as const, level: "warning" as const, message })));
    quality.push(
      qualityRow(
        "metrics",
        DATASET_FILES.metrics,
        true,
        metrics.length,
        metrics.length ? Object.keys(metrics[0]).length : 0,
        countMissingValues(metricsContent),
        countDuplicateKeys("metrics", metrics),
        metrics.filter((row) => !row.lastActualDate).length,
        0
      )
    );
  } else {
    markMissing("metrics", DATASET_FILES.metrics);
  }

  if (trainingSummaryContent) {
    loadedFiles.trainingSummary = DATASET_FILES.trainingSummary;
    const parsed = parseTrainingSummaryRows(trainingSummaryContent);
    trainingSummary = parsed.rows;
    warnings.push(...parsed.warnings.map((message) => ({ dataset: "trainingSummary" as const, level: "warning" as const, message })));
    quality.push(
      qualityRow(
        "trainingSummary",
        DATASET_FILES.trainingSummary,
        true,
        trainingSummary.length,
        trainingSummary.length ? Object.keys(trainingSummary[0]).length : 0,
        countMissingValues(trainingSummaryContent),
        countDuplicateKeys("trainingSummary", trainingSummary),
        trainingSummary.filter((row) => !row.lastActualDate).length,
        0
      )
    );
  } else {
    markMissing("trainingSummary", DATASET_FILES.trainingSummary);
  }

  return {
    forecast,
    presentation,
    weeklySummary,
    validation,
    test,
    metrics,
    trainingSummary,
    warnings,
    quality,
    loadedFiles,
  };
});
