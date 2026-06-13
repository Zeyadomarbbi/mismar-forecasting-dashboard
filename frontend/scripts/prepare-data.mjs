import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";

const rootDir = path.resolve(process.cwd(), "..");
const publicDataDir = path.join(process.cwd(), "public", "data");
const searchDirs = [
  rootDir,
  path.join(rootDir, "data"),
  path.join(rootDir, "results"),
  "/content/lstm_forecasting_results",
];

const files = [
  "01_all_series_next_7_days_forecast.csv",
  "02_presentation_forecast.csv",
  "03_weekly_forecast_summary.csv",
  "04_all_validation_results.csv",
  "05_all_test_results.csv",
  "06_model_metrics.csv",
  "07_training_summary.csv",
];

function normalizeHeader(value) {
  return value.replace(/^\uFEFF/, "").trim();
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function locateFile(fileName) {
  for (const dir of searchDirs) {
    const fullPath = path.join(dir, fileName);
    if (await exists(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

function parseCsv(content) {
  return Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
    transform: (value) => value.replace(/^\uFEFF/, "").trim(),
  }).data;
}

function summarize(fileName, rows) {
  const missingValues = rows.reduce((sum, row) => sum + Object.values(row).filter((value) => !String(value ?? "").trim()).length, 0);
  const duplicateKeys = new Set();
  let duplicateCount = 0;
  let invalidDates = 0;
  let negativeForecasts = 0;

  for (const row of rows) {
    const series = row["السلسلة"] ?? row["المدينة"] ?? "";
    const date = row["اليوم"] ?? row["التاريخ"] ?? "";
    const datasetType = row["نوع البيانات"] ?? row["نوع التوقع"] ?? "";
    const key = fileName.startsWith("04_") || fileName.startsWith("05_")
      ? `${series}|${datasetType}|${date}`
      : `${series}|${date}`;
    if (duplicateKeys.has(key)) {
      duplicateCount += 1;
    } else {
      duplicateKeys.add(key);
    }
    if (date && Number.isNaN(new Date(date).getTime())) {
      invalidDates += 1;
    }
    const forecast = Number(row["الطلبات المتوقعة"] ?? row["Forecast"] ?? "");
    if (Number.isFinite(forecast) && forecast < 0) {
      negativeForecasts += 1;
    }
  }

  return {
    rows: rows.length,
    columns: rows[0] ? Object.keys(rows[0]).length : 0,
    missingValues,
    duplicateCount,
    invalidDates,
    negativeForecasts,
  };
}

async function main() {
  await fs.mkdir(publicDataDir, { recursive: true });
  const report = [];

  for (const fileName of files) {
    const sourcePath = await locateFile(fileName);
    if (!sourcePath) {
      console.error(`Missing file: ${fileName}`);
      process.exitCode = 1;
      continue;
    }
    const content = await fs.readFile(sourcePath, "utf-8");
    const normalized = content.replace(/^\uFEFF/, "");
    const targetPath = path.join(publicDataDir, fileName);
    await fs.writeFile(targetPath, normalized, "utf-8");
    const rows = parseCsv(normalized);
    report.push({ fileName, sourcePath, ...summarize(fileName, rows) });
  }

  console.log("Data preparation summary");
  console.table(report);

  if (process.exitCode && process.exitCode !== 0) {
    throw new Error("One or more required CSV files were missing.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
