from __future__ import annotations

from io import BytesIO
from typing import Iterable

import pandas as pd

NAVY = "#12304A"
TEAL = "#0F8B8D"
BLUE = "#2563EB"
ORANGE = "#F59E0B"
GREEN = "#16A34A"
PURPLE = "#7C3AED"
GRAY = "#64748B"
LIGHT_BG = "#F8FAFC"
RED = "#DC2626"

MAJOR_CITIES = ["الرياض", "الشرقية", "جدة", "الأحساء"]
ALL_CITIES_SERIES = "كل المدن"
OTHER_CITIES_LABEL = "مدن أخرى"
TARGET_SERIES = MAJOR_CITIES + [ALL_CITIES_SERIES]

SERIES_COLORS = {
    "الرياض": BLUE,
    "الشرقية": ORANGE,
    "جدة": GREEN,
    "الأحساء": PURPLE,
    "كل المدن": TEAL,
    "مدن أخرى": "#94A3B8",
}

PAGE_LABELS = {
    "executive": "Executive Forecast",
    "cities": "City Forecasts",
    "all_cities": "All Cities Forecast",
    "performance": "Model Performance",
    "methodology": "Methodology",
}

ARABIC_DAY_MAP = {
    "Monday": "الاثنين",
    "Tuesday": "الثلاثاء",
    "Wednesday": "الأربعاء",
    "Thursday": "الخميس",
    "Friday": "الجمعة",
    "Saturday": "السبت",
    "Sunday": "الأحد",
}

WEEKDAY_ORDER_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]


def arabic_day_name(value) -> str:
    if pd.isna(value):
        return "غير متاح"
    if isinstance(value, pd.Timestamp):
        return ARABIC_DAY_MAP.get(value.day_name(), value.day_name())
    text = str(value).strip()
    return ARABIC_DAY_MAP.get(text, text)


def ensure_arabic_day_column(df: pd.DataFrame, date_col: str = "date") -> pd.DataFrame:
    if df.empty:
        return df.copy()
    result = df.copy()
    if "day_name" not in result.columns or result["day_name"].isna().all():
        if date_col in result.columns:
            result["day_name"] = result[date_col].apply(arabic_day_name)
    result["day_name_ar"] = result["day_name"].apply(arabic_day_name) if "day_name" in result.columns else "غير متاح"
    return result


def format_int(value) -> str:
    if pd.isna(value):
        return "غير متاح"
    try:
        return f"{float(value):,.0f}"
    except (TypeError, ValueError):
        return str(value)


def format_float(value, digits: int = 2) -> str:
    if pd.isna(value):
        return "غير متاح"
    try:
        return f"{float(value):,.{digits}f}"
    except (TypeError, ValueError):
        return str(value)


def format_percent(value, digits: int = 2) -> str:
    if pd.isna(value):
        return "غير متاح"
    try:
        return f"{float(value):,.{digits}f}%"
    except (TypeError, ValueError):
        return str(value)


def format_date(value) -> str:
    if pd.isna(value):
        return "غير متاح"
    return pd.Timestamp(value).strftime("%Y-%m-%d")


def safe_divide(numerator, denominator):
    if pd.isna(numerator) or pd.isna(denominator):
        return None
    try:
        denominator = float(denominator)
    except (TypeError, ValueError):
        return None
    if denominator == 0:
        return None
    return float(numerator) / denominator


def classify_wape(value) -> str:
    if pd.isna(value):
        return "غير متاح"
    value = float(value)
    if value < 10:
        return "ممتاز"
    if value < 20:
        return "جيد"
    if value < 30:
        return "مقبول بحذر"
    return "يحتاج تحسين"


def bias_label(value) -> str:
    if pd.isna(value):
        return "غير متاح"
    value = float(value)
    if value > 0:
        return "Over Forecasting"
    if value < 0:
        return "Under Forecasting"
    return "متوازن تقريبًا"


def status_label(value) -> str:
    if pd.isna(value):
        return "غير متاح"
    return "نعم" if str(value).strip() == "نعم" else "لا"


def reorder_series(series_values: Iterable[str]) -> list[str]:
    unique_values = list(dict.fromkeys([value for value in series_values if pd.notna(value)]))
    ordered = [series for series in TARGET_SERIES if series in unique_values]
    extras = [series for series in unique_values if series not in ordered]
    return ordered + sorted(extras)


def to_csv_download(df: pd.DataFrame) -> bytes:
    export_df = df.copy()
    return export_df.to_csv(index=False).encode("utf-8-sig")


def build_excel_file(sheets: dict[str, pd.DataFrame]) -> bytes:
    output = BytesIO()
    engine = None
    for candidate in ("xlsxwriter", "openpyxl"):
        try:
            __import__(candidate)
            engine = candidate
            break
        except ModuleNotFoundError:
            continue
    if engine is None:
        return b""
    with pd.ExcelWriter(output, engine=engine) as writer:
        for sheet_name, frame in sheets.items():
            frame.to_excel(writer, sheet_name=sheet_name[:31], index=False)
    return output.getvalue()


def replace_nan_for_display(df: pd.DataFrame) -> pd.DataFrame:
    return df.replace({pd.NA: "غير متاح"}).fillna("غير متاح")
