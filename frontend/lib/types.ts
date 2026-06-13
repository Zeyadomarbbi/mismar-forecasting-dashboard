export type DatasetKey =
  | "forecast"
  | "presentation"
  | "weeklySummary"
  | "validation"
  | "test"
  | "metrics"
  | "trainingSummary";

export type ForecastRow = {
  series: string;
  date: string;
  dayNameAr: string;
  forecastOrders: number | null;
  forecastType?: string | null;
  forecastStart?: string | null;
  forecastEnd?: string | null;
  weeklyForecastTotal?: number | null;
};

export type WeeklySummaryRow = {
  series: string;
  forecastStart?: string | null;
  forecastEnd?: string | null;
  weeklyForecastTotal: number | null;
  dailyAverage: number | null;
  dailyMax: number | null;
  dailyMin: number | null;
};

export type ResultRow = {
  series: string;
  datasetType: "Validation" | "Test" | string;
  date: string;
  dayNameAr: string;
  actualOrders: number | null;
  forecastOrders: number | null;
  error: number | null;
  absoluteError: number | null;
};

export type ModelMetricRow = {
  series: string;
  firstDate?: string | null;
  lastActualDate?: string | null;
  daysCount?: number | null;
  historicalTotalOrders?: number | null;
  historicalDailyAverage?: number | null;
  bestEpoch?: number | null;
  validationMae?: number | null;
  validationRmse?: number | null;
  validationWape?: number | null;
  testMae?: number | null;
  testRmse?: number | null;
  testWape?: number | null;
  testBias?: number | null;
  baselineMae?: number | null;
  baselineRmse?: number | null;
  baselineWape?: number | null;
  betterThanBaseline?: string | null;
};

export type TrainingSummaryRow = {
  series: string;
  trainingStatus?: string | null;
  lastActualDate?: string | null;
  forecastStart?: string | null;
  forecastEnd?: string | null;
  weeklyForecastTotal?: number | null;
  finalEpochs?: number | null;
};

export type DatasetWarning = {
  dataset: DatasetKey;
  level: "warning" | "error";
  message: string;
};

export type DataQualitySummary = {
  dataset: DatasetKey;
  fileName: string;
  loaded: boolean;
  rowCount: number;
  columnCount: number;
  missingValues: number;
  duplicateRows: number;
  invalidDates: number;
  negativeForecasts: number;
};

export type DashboardDatasets = {
  forecast: ForecastRow[];
  presentation: ForecastRow[];
  weeklySummary: WeeklySummaryRow[];
  validation: ResultRow[];
  test: ResultRow[];
  metrics: ModelMetricRow[];
  trainingSummary: TrainingSummaryRow[];
  warnings: DatasetWarning[];
  quality: DataQualitySummary[];
  loadedFiles: Record<DatasetKey, string | null>;
};
