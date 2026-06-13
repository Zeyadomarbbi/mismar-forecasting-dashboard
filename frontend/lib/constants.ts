export const DATASET_FILES = {
  forecast: "01_all_series_next_7_days_forecast.csv",
  presentation: "02_presentation_forecast.csv",
  weeklySummary: "03_weekly_forecast_summary.csv",
  validation: "04_all_validation_results.csv",
  test: "05_all_test_results.csv",
  metrics: "06_model_metrics.csv",
  trainingSummary: "07_training_summary.csv",
} as const;

export const MAJOR_CITIES = ["الرياض", "الشرقية", "جدة", "الأحساء"] as const;
export const ALL_CITIES_LABEL = "كل المدن";
export const OTHER_CITIES_LABEL = "مدن أخرى";
export const ALL_SERIES = [...MAJOR_CITIES, ALL_CITIES_LABEL] as const;

export const NAV_ITEMS = [
  { href: "/", label: "النظرة التنفيذية" },
  { href: "/city-forecasts", label: "توقعات المدن" },
  { href: "/all-cities", label: "توقع كل المدن" },
  { href: "/actual-vs-predicted", label: "ملخص الأسبوع القادم" },
  { href: "/methodology", label: "المنهجية" },
] as const;

export const SERIES_COLORS: Record<string, string> = {
  "كل المدن": "#0F8B8D",
  "الرياض": "#2563EB",
  "الشرقية": "#F59E0B",
  "جدة": "#16A34A",
  "الأحساء": "#7C3AED",
  "مدن أخرى": "#94A3B8",
};

export const ARABIC_DAY_MAP: Record<string, string> = {
  Monday: "الاثنين",
  Tuesday: "الثلاثاء",
  Wednesday: "الأربعاء",
  Thursday: "الخميس",
  Friday: "الجمعة",
  Saturday: "السبت",
  Sunday: "الأحد",
};

export const WEEKDAY_ORDER_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export const FILE_SEARCH_PATHS = [
  ".",
  "data",
  "results",
  "/content/lstm_forecasting_results",
];
