from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pandas as pd
import streamlit as st

from utils import (
    ALL_CITIES_SERIES,
    MAJOR_CITIES,
    TARGET_SERIES,
    ensure_arabic_day_column,
    reorder_series,
    safe_divide,
)

SEARCH_DIRS = [Path("./data"), Path("./"), Path("/content/lstm_forecasting_results")]
FILE_MAP = {
    "forecast": "01_all_series_next_7_days_forecast.csv",
    "presentation": "02_presentation_forecast.csv",
    "weekly_summary": "03_weekly_forecast_summary.csv",
    "validation": "04_all_validation_results.csv",
    "test": "05_all_test_results.csv",
    "metrics": "06_model_metrics.csv",
    "training_summary": "07_training_summary.csv",
}

ALIASES = {
    "series": ["السلسلة", "المدينة", "Series", "City"],
    "forecast_type": ["نوع التوقع", "نوع البيانات", "Type"],
    "data_type": ["نوع البيانات", "نوع التوقع", "Type"],
    "date": ["اليوم", "التاريخ", "Date", "ds"],
    "day_name": ["اسم اليوم", "day_name", "Day Name"],
    "forecast": ["الطلبات المتوقعة", "Forecast", "Predicted", "prediction"],
    "actual": ["الطلبات الفعلية", "Actual"],
    "error": ["الخطأ", "Error"],
    "abs_error": ["الخطأ المطلق", "Absolute Error"],
    "forecast_start": ["بداية التوقع", "بداية_التوقع", "Forecast Start"],
    "forecast_end": ["نهاية التوقع", "نهاية_التوقع", "Forecast End"],
    "weekly_total": ["إجمالي توقع الأسبوع", "إجمالي_الطلبات_المتوقعة", "إجمالي الطلبات المتوقعة"],
    "daily_avg": ["متوسط_الطلبات_اليومي", "متوسط الطلبات اليومي"],
    "daily_max": ["أعلى_توقع_يومي", "أعلى توقع يومي"],
    "daily_min": ["أقل_توقع_يومي", "أقل توقع يومي"],
    "first_date": ["أول تاريخ"],
    "last_actual_date": ["آخر تاريخ فعلي"],
    "days_count": ["عدد الأيام"],
    "historical_total": ["إجمالي الطلبات"],
    "historical_daily_avg": ["متوسط الطلبات اليومية"],
    "best_epoch": ["أفضل Epoch", "عدد Epochs النهائي"],
    "validation_mae": ["Validation_MAE", "Validation MAE"],
    "validation_rmse": ["Validation_RMSE", "Validation RMSE"],
    "validation_wape": ["Validation_WAPE_Percent", "Validation WAPE"],
    "test_mae": ["Test_MAE", "Test MAE"],
    "test_rmse": ["Test_RMSE", "Test RMSE"],
    "test_wape": ["Test_WAPE_Percent", "Test WAPE"],
    "test_bias": ["Test_Bias_Percent", "Bias", "Test Bias"],
    "baseline_mae": ["Baseline_MAE", "Baseline MAE"],
    "baseline_rmse": ["Baseline_RMSE", "Baseline RMSE"],
    "baseline_wape": ["Baseline_WAPE_Percent", "Baseline WAPE"],
    "better_than_baseline": ["أفضل من Baseline", "Better Than Baseline"],
    "training_status": ["حالة التدريب"],
    "final_epochs": ["عدد Epochs النهائي", "أفضل Epoch"],
}

NUMERIC_COLUMNS = [
    "forecast",
    "actual",
    "error",
    "abs_error",
    "weekly_total",
    "daily_avg",
    "daily_max",
    "daily_min",
    "days_count",
    "historical_total",
    "historical_daily_avg",
    "best_epoch",
    "validation_mae",
    "validation_rmse",
    "validation_wape",
    "test_mae",
    "test_rmse",
    "test_wape",
    "test_bias",
    "baseline_mae",
    "baseline_rmse",
    "baseline_wape",
    "final_epochs",
]

DATE_COLUMNS = ["date", "forecast_start", "forecast_end", "first_date", "last_actual_date"]


@dataclass
class DataQualityIssue:
    level: str
    dataset: str
    message: str


@dataclass
class DataBundle:
    frames: dict[str, pd.DataFrame]
    loaded_files: dict[str, str]
    missing_files: list[str]
    quality_issues: list[DataQualityIssue] = field(default_factory=list)

    def get(self, key: str) -> pd.DataFrame:
        return self.frames.get(key, pd.DataFrame()).copy()


def _clean_column_name(name: Any) -> str:
    return str(name).replace("\ufeff", "").strip()


def _read_csv(path: Path) -> pd.DataFrame:
    for encoding in ("utf-8-sig", "utf-8", "cp1256", "latin-1"):
        try:
            return pd.read_csv(path, encoding=encoding)
        except UnicodeDecodeError:
            continue
    return pd.read_csv(path)


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    result.columns = [_clean_column_name(column) for column in result.columns]
    return result


def _apply_aliases(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    normalized_lookup = {_clean_column_name(column): column for column in result.columns}
    renamed: dict[str, str] = {}
    matched_originals: set[str] = set()
    for canonical, names in ALIASES.items():
        for name in names:
            match = normalized_lookup.get(_clean_column_name(name))
            if match and match not in matched_originals:
                renamed[match] = canonical
                matched_originals.add(match)
                break
    return result.rename(columns=renamed)


def _convert_types(df: pd.DataFrame) -> pd.DataFrame:
    result = df.copy()
    for column in DATE_COLUMNS:
        if column in result.columns:
            result[column] = pd.to_datetime(result[column], errors="coerce")
    for column in NUMERIC_COLUMNS:
        if column in result.columns:
            result[column] = pd.to_numeric(result[column], errors="coerce")
    for column in ("series", "data_type", "forecast_type", "training_status", "better_than_baseline"):
        if column in result.columns:
            result[column] = result[column].astype("string").str.strip()
    return result


def _discover_file(filename: str) -> Path | None:
    for directory in SEARCH_DIRS:
        candidate = directory / filename
        if candidate.exists():
            return candidate.resolve()
    return None


def _aggregate_duplicates(frame: pd.DataFrame, group_columns: list[str], dataset_name: str, issues: list[DataQualityIssue]) -> pd.DataFrame:
    if frame.empty or not all(column in frame.columns for column in group_columns):
        return frame
    if not frame.duplicated(group_columns, keep=False).any():
        return frame
    issues.append(
        DataQualityIssue(
            level="warning",
            dataset=dataset_name,
            message=f"تم العثور على صفوف مكررة في {dataset_name} وتم تجميعها تلقائيًا.",
        )
    )
    numeric_columns = [column for column in frame.columns if pd.api.types.is_numeric_dtype(frame[column])]
    grouped = frame.groupby(group_columns, dropna=False, as_index=False)
    aggregated = grouped[numeric_columns].sum(min_count=1) if numeric_columns else frame[group_columns].drop_duplicates().copy()
    for column in frame.columns:
        if column in group_columns or column in numeric_columns:
            continue
        aggregated[column] = grouped[column].first().values
    if {"actual", "forecast"}.issubset(aggregated.columns):
        aggregated["error"] = aggregated["actual"] - aggregated["forecast"]
        aggregated["abs_error"] = aggregated["error"].abs()
    return aggregated


def _validate_frame(dataset_name: str, frame: pd.DataFrame, issues: list[DataQualityIssue]) -> pd.DataFrame:
    result = frame.copy()
    if dataset_name in {"forecast", "presentation", "validation", "test"} and "date" in result.columns:
        result = ensure_arabic_day_column(result)
    if dataset_name == "forecast":
        result = _aggregate_duplicates(result, ["series", "date"], dataset_name, issues)
        if "forecast" in result.columns and (result["forecast"] < 0).any():
            issues.append(DataQualityIssue("warning", dataset_name, "توجد قيم Forecast سالبة في البيانات."))
        if {"series", "date"}.issubset(result.columns):
            day_counts = result.groupby("series")["date"].nunique()
            if (day_counts != 7).any():
                issues.append(DataQualityIssue("warning", dataset_name, "ليست كل السلاسل تحتوي على 7 أيام Forecast كاملة."))
    if dataset_name in {"validation", "test"}:
        result = _aggregate_duplicates(result, ["series", "data_type", "date"], dataset_name, issues)
    if "series" in result.columns:
        available = set(result["series"].dropna().tolist())
        missing = [series for series in TARGET_SERIES if series not in available]
        if missing:
            issues.append(DataQualityIssue("warning", dataset_name, f"السلاسل غير الموجودة: {', '.join(missing)}"))
    if "date" in result.columns and result["date"].isna().any():
        issues.append(DataQualityIssue("warning", dataset_name, "توجد تواريخ غير صالحة في هذا الملف."))
    return result


def _prepare_frame(dataset_name: str, raw_df: pd.DataFrame, issues: list[DataQualityIssue]) -> pd.DataFrame:
    frame = _normalize_columns(raw_df)
    frame = _apply_aliases(frame)
    frame = _convert_types(frame)
    return _validate_frame(dataset_name, frame, issues)


@st.cache_data(show_spinner=False)
def load_data_bundle() -> DataBundle:
    frames: dict[str, pd.DataFrame] = {}
    loaded_files: dict[str, str] = {}
    missing_files: list[str] = []
    quality_issues: list[DataQualityIssue] = []

    for key, filename in FILE_MAP.items():
        path = _discover_file(filename)
        if path is None:
            frames[key] = pd.DataFrame()
            missing_files.append(filename)
            quality_issues.append(DataQualityIssue("error", key, f"الملف {filename} غير موجود."))
            continue
        raw_df = _read_csv(path)
        frames[key] = _prepare_frame(key, raw_df, quality_issues)
        loaded_files[key] = str(path)

    if not frames["presentation"].empty and "data_type" not in frames["presentation"].columns:
        frames["presentation"]["data_type"] = "Forecast"
    if not frames["forecast"].empty and "data_type" not in frames["forecast"].columns:
        frames["forecast"]["data_type"] = "Forecast"

    combined = pd.concat(
        [frames.get("validation", pd.DataFrame()), frames.get("test", pd.DataFrame())],
        ignore_index=True,
        sort=False,
    )
    if not combined.empty:
        combined = ensure_arabic_day_column(combined)
    frames["combined_results"] = combined

    return DataBundle(frames=frames, loaded_files=loaded_files, missing_files=missing_files, quality_issues=quality_issues)


def latest_actual_date(bundle: DataBundle):
    metrics = bundle.get("metrics")
    training = bundle.get("training_summary")
    candidates = []
    if "last_actual_date" in metrics.columns and not metrics["last_actual_date"].dropna().empty:
        candidates.append(metrics["last_actual_date"].dropna().max())
    if "last_actual_date" in training.columns and not training["last_actual_date"].dropna().empty:
        candidates.append(training["last_actual_date"].dropna().max())
    return max(candidates) if candidates else None


def latest_refresh_date(bundle: DataBundle):
    forecast = bundle.get("forecast")
    if "date" in forecast.columns and not forecast["date"].dropna().empty:
        return forecast["date"].dropna().max()
    return None


def forecast_period(bundle: DataBundle):
    forecast = bundle.get("forecast")
    if forecast.empty or "date" not in forecast.columns or forecast["date"].dropna().empty:
        return None, None
    return forecast["date"].min(), forecast["date"].max()


def data_status_table(bundle: DataBundle) -> pd.DataFrame:
    rows = []
    for dataset_name, filename in FILE_MAP.items():
        frame = bundle.frames.get(dataset_name, pd.DataFrame())
        rows.append(
            {
                "dataset": dataset_name,
                "filename": filename,
                "loaded": "نعم" if dataset_name in bundle.loaded_files else "لا",
                "rows": len(frame),
                "columns": len(frame.columns),
                "missing_values": int(frame.isna().sum().sum()) if not frame.empty else 0,
                "duplicate_rows": int(frame.duplicated().sum()) if not frame.empty else 0,
            }
        )
    return pd.DataFrame(rows)


def forecast_frame(bundle: DataBundle, selected_series: list[str] | None = None, start_date=None, end_date=None) -> pd.DataFrame:
    frame = bundle.get("forecast")
    if frame.empty:
        return frame
    if selected_series:
        frame = frame[frame["series"].isin(selected_series)]
    if start_date is not None:
        frame = frame[frame["date"] >= pd.Timestamp(start_date)]
    if end_date is not None:
        frame = frame[frame["date"] <= pd.Timestamp(end_date)]
    return frame.sort_values(["series", "date"]).copy()


def weekly_summary_metrics(bundle: DataBundle) -> pd.DataFrame:
    frame = bundle.get("weekly_summary")
    return frame.sort_values("weekly_total", ascending=False).copy() if not frame.empty and "weekly_total" in frame.columns else frame


def model_metrics(bundle: DataBundle) -> pd.DataFrame:
    frame = bundle.get("metrics")
    if frame.empty:
        return frame
    result = frame.copy()
    result["improvement"] = result["baseline_wape"] - result["test_wape"]
    result["improvement_pct"] = result.apply(
        lambda row: safe_divide(row["improvement"], row["baseline_wape"]) * 100 if safe_divide(row["improvement"], row["baseline_wape"]) is not None else None,
        axis=1,
    )
    return result.sort_values("test_wape", ascending=True)


def city_forecast_table(bundle: DataBundle, city_name: str) -> pd.DataFrame:
    frame = forecast_frame(bundle, [city_name])
    if frame.empty:
        return frame
    result = frame.copy()
    result["diff_from_previous"] = result["forecast"].diff()
    result["pct_change"] = result["forecast"].pct_change() * 100
    result["rank_in_week"] = result["forecast"].rank(ascending=False, method="dense").astype("Int64")
    return result


def four_city_total_by_day(bundle: DataBundle) -> pd.DataFrame:
    forecast = forecast_frame(bundle, MAJOR_CITIES)
    if forecast.empty:
        return forecast
    result = (
        forecast.groupby("date", as_index=False)["forecast"]
        .sum()
        .rename(columns={"forecast": "forecast_major_cities"})
        .sort_values("date")
    )
    return result


def all_cities_comparison(bundle: DataBundle) -> pd.DataFrame:
    all_cities = city_forecast_table(bundle, ALL_CITIES_SERIES)[["date", "forecast"]].rename(columns={"forecast": "forecast_all_cities"})
    major_total = four_city_total_by_day(bundle)
    if all_cities.empty or major_total.empty:
        return pd.DataFrame()
    comparison = all_cities.merge(major_total, on="date", how="left")
    comparison["difference"] = comparison["forecast_all_cities"] - comparison["forecast_major_cities"]
    comparison["difference_pct"] = comparison.apply(
        lambda row: safe_divide(row["difference"], row["forecast_major_cities"]) * 100 if safe_divide(row["difference"], row["forecast_major_cities"]) is not None else None,
        axis=1,
    )
    comparison["other_cities"] = comparison["difference"].where(comparison["difference"] >= 0)
    return comparison


def other_cities_weekly_estimate(bundle: DataBundle):
    comparison = all_cities_comparison(bundle)
    if comparison.empty:
        return None
    total = comparison["other_cities"].sum(min_count=1)
    return total if pd.notna(total) and total >= 0 else None


def available_series(bundle: DataBundle) -> list[str]:
    forecast = bundle.get("forecast")
    if forecast.empty or "series" not in forecast.columns:
        return reorder_series(TARGET_SERIES)
    return reorder_series(forecast["series"].dropna().unique())
