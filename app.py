from __future__ import annotations

from pathlib import Path

import pandas as pd
import streamlit as st

from charts import (
    absolute_error_chart,
    actual_predicted_scatter,
    actual_vs_predicted_chart,
    all_cities_comparison_chart,
    all_cities_forecast_chart,
    bias_chart,
    city_comparison_chart,
    city_forecast_area_chart,
    daily_heatmap,
    difference_bar_chart,
    error_bar_chart,
    forecast_distribution_chart,
    historical_volume_scatter,
    single_metric_bar,
    wape_vs_baseline_chart,
    weekly_city_totals_chart,
)
from components import inject_metric_card, insight_box, page_header, section_title
from data_loader import (
    FILE_MAP,
    all_cities_comparison,
    available_series,
    city_forecast_table,
    data_status_table,
    forecast_frame,
    forecast_period,
    latest_actual_date,
    latest_refresh_date,
    load_data_bundle,
    model_metrics,
    other_cities_weekly_estimate,
    weekly_summary_metrics,
)
from utils import (
    ALL_CITIES_SERIES,
    BLUE,
    MAJOR_CITIES,
    NAVY,
    ORANGE,
    OTHER_CITIES_LABEL,
    PAGE_LABELS,
    PURPLE,
    RED,
    SERIES_COLORS,
    TEAL,
    GREEN,
    build_excel_file,
    bias_label,
    classify_wape,
    format_date,
    format_float,
    format_int,
    format_percent,
    replace_nan_for_display,
    status_label,
    to_csv_download,
)

st.set_page_config(page_title="لوحة توقع طلبات الغسيل", page_icon="📊", layout="wide", initial_sidebar_state="expanded")


def load_styles():
    path = Path("styles.css")
    if path.exists():
        st.markdown(f"<style>{path.read_text(encoding='utf-8')}</style>", unsafe_allow_html=True)


def reset_filters():
    for key in [
        "sidebar_series",
        "sidebar_cities",
        "sidebar_dataset",
        "sidebar_metric",
        "sidebar_page",
        "exec_cities",
        "exec_chart_mode",
        "exec_view_mode",
    ]:
        st.session_state.pop(key, None)
    st.rerun()


def sidebar_controls(bundle):
    forecast = bundle.get("forecast")
    all_series = available_series(bundle)
    min_date, max_date = forecast_period(bundle)
    with st.sidebar:
        st.markdown("### التنقل")
        page = st.radio("القائمة الرئيسية", list(PAGE_LABELS.values()), key="sidebar_page")
        st.markdown("### الفلاتر العامة")
        series_selection = st.selectbox("Forecast series selector", options=all_series, index=all_series.index(ALL_CITIES_SERIES) if ALL_CITIES_SERIES in all_series else 0, key="sidebar_series")
        selected_cities = st.multiselect("المدن", options=MAJOR_CITIES, default=MAJOR_CITIES, key="sidebar_cities")
        date_value = st.date_input("Date range selector", value=(min_date.to_pydatetime(), max_date.to_pydatetime()) if min_date is not None and max_date is not None else (), min_value=min_date.to_pydatetime() if min_date is not None else None, max_value=max_date.to_pydatetime() if max_date is not None else None)
        dataset = st.selectbox("Dataset selector", options=["Forecast", "Test", "Validation"], key="sidebar_dataset")
        metric = st.selectbox("Metric selector", options=["Test WAPE", "MAE", "RMSE", "Bias"], key="sidebar_metric")
        st.button("Reset filters", use_container_width=True, on_click=reset_filters)
        with st.expander("Data Status", expanded=False):
            status_df = data_status_table(bundle)
            st.dataframe(status_df, use_container_width=True, hide_index=True)
            if bundle.missing_files:
                st.error("ملفات مفقودة: " + "، ".join(bundle.missing_files))
            for issue in bundle.quality_issues:
                if issue.level == "error":
                    st.error(f"{issue.dataset}: {issue.message}")
                else:
                    st.warning(f"{issue.dataset}: {issue.message}")

    start_date, end_date = (None, None)
    if isinstance(date_value, tuple) and len(date_value) == 2:
        start_date, end_date = date_value
    elif isinstance(date_value, list) and len(date_value) == 2:
        start_date, end_date = date_value[0], date_value[1]

    return {
        "page": page,
        "series_selection": series_selection,
        "selected_cities": selected_cities or MAJOR_CITIES,
        "start_date": start_date,
        "end_date": end_date,
        "dataset": dataset,
        "metric": metric,
    }


def display_plot(fig):
    try:
        st.plotly_chart(fig, use_container_width=True)
    except Exception as exc:
        st.warning(f"تعذر عرض الرسم: {exc}")


def executive_filter_bar(bundle, controls):
    forecast = forecast_frame(bundle, controls["selected_cities"], controls["start_date"], controls["end_date"])
    available_dates = sorted(forecast["date"].dropna().unique()) if not forecast.empty else []
    with st.container():
        st.markdown('<div class="filter-bar">', unsafe_allow_html=True)
        col1, col2, col3, col4, col5 = st.columns([2.2, 2.2, 1.6, 1.5, 0.9])
        with col1:
            cities = st.multiselect("City multi-select", options=MAJOR_CITIES, default=controls["selected_cities"], key="exec_cities")
        with col2:
            date_range = st.date_input(
                "Forecast date range",
                value=(controls["start_date"], controls["end_date"]) if controls["start_date"] and controls["end_date"] else (),
                min_value=available_dates[0].to_pydatetime() if available_dates else None,
                max_value=available_dates[-1].to_pydatetime() if available_dates else None,
                key="exec_date_range",
            )
        with col3:
            chart_mode = st.selectbox("Values / percentage", ["القيم الفعلية", "نسبة التغير من أول يوم"], key="exec_chart_mode")
        with col4:
            view_mode = st.selectbox("Daily / weekly view", ["يومي", "أسبوعي"], key="exec_view_mode")
        with col5:
            st.write("")
            st.write("")
            st.button("Reset", on_click=reset_filters, use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)
    start_date, end_date = controls["start_date"], controls["end_date"]
    if isinstance(date_range, tuple) and len(date_range) == 2:
        start_date, end_date = date_range
    elif isinstance(date_range, list) and len(date_range) == 2:
        start_date, end_date = date_range[0], date_range[1]
    return cities or MAJOR_CITIES, start_date, end_date, chart_mode, view_mode


def render_executive_page(bundle, controls):
    period_start, period_end = forecast_period(bundle)
    page_header(
        "لوحة توقع طلبات الغسيل",
        "يعرض هذا التطبيق توقع الطلب خلال الأيام السبعة القادمة حسب المدن الرئيسية وكذلك لموديل كل المدن.",
        [
            ("فترة التوقع", f"{format_date(period_start)} إلى {format_date(period_end)}"),
            ("آخر تاريخ فعلي", format_date(latest_actual_date(bundle))),
            ("آخر تحديث", format_date(latest_refresh_date(bundle))),
        ],
    )
    cities, start_date, end_date, chart_mode, view_mode = executive_filter_bar(bundle, controls)
    filtered = forecast_frame(bundle, cities + [ALL_CITIES_SERIES], start_date, end_date)
    if filtered.empty:
        st.warning("لا توجد بيانات Forecast متاحة للفلاتر الحالية.")
        return

    weekly = weekly_summary_metrics(bundle)
    metrics_df = model_metrics(bundle)
    all_cities_forecast = city_forecast_table(bundle, ALL_CITIES_SERIES)
    all_cities_filtered = all_cities_forecast[(all_cities_forecast["date"] >= pd.Timestamp(start_date)) & (all_cities_forecast["date"] <= pd.Timestamp(end_date))] if start_date and end_date else all_cities_forecast
    four_cities_filtered = filtered[filtered["series"].isin(cities)].copy()
    top_city_totals = four_cities_filtered.groupby("series", as_index=False)["forecast"].sum().sort_values("forecast", ascending=False)
    top_city = top_city_totals.iloc[0]["series"] if not top_city_totals.empty else "غير متاح"
    daily_sum = all_cities_filtered.groupby("date", as_index=False)["forecast"].sum()
    peak_day = daily_sum.loc[daily_sum["forecast"].idxmax()] if not daily_sum.empty else None

    section_title("المؤشرات الرئيسية")
    kpi_row = st.columns(6)
    with kpi_row[0]:
        inject_metric_card("All Cities weekly forecast", format_int(all_cities_filtered["forecast"].sum()), "إجمالي التوقع خلال الفترة", TEAL)
    with kpi_row[1]:
        inject_metric_card("All Cities average daily forecast", format_float(all_cities_filtered["forecast"].mean()), "متوسط يومي", TEAL)
    with kpi_row[2]:
        inject_metric_card("Highest forecast day", format_date(peak_day["date"]) if peak_day is not None else "غير متاح", format_int(peak_day["forecast"]) if peak_day is not None else "", NAVY)
    with kpi_row[3]:
        inject_metric_card("Highest forecast city", top_city, "ضمن المدن المختارة", BLUE)
    with kpi_row[4]:
        inject_metric_card("Forecast period", f"{format_date(start_date)} - {format_date(end_date)}", "بعد الفلاتر الحالية", NAVY)
    with kpi_row[5]:
        inject_metric_card("Number of forecast models", format_int(len(weekly["series"].unique()) if not weekly.empty else 0), "عدد السلاسل المتاحة", NAVY)

    section_title("مؤشرات المدن الرئيسية")
    city_columns = st.columns(4)
    color_map = {"الرياض": BLUE, "الشرقية": ORANGE, "جدة": GREEN, "الأحساء": PURPLE}
    four_city_total = four_cities_filtered["forecast"].sum()
    for city, column in zip(MAJOR_CITIES, city_columns):
        city_df = filtered[filtered["series"] == city]
        if city_df.empty:
            with column:
                inject_metric_card(city, "غير متاح", "لا توجد بيانات", color_map[city])
            continue
        share = (city_df["forecast"].sum() / four_city_total * 100) if four_city_total else None
        peak_value = city_df["forecast"].max()
        with column:
            inject_metric_card(
                city,
                format_int(city_df["forecast"].sum()),
                f"متوسط {format_float(city_df['forecast'].mean())} | أعلى يوم {format_int(peak_value)} | حصة {format_percent(share)}",
                color_map[city],
            )

    section_title("الرسوم الرئيسية", "التركيز على Forecast كل المدن ثم المقارنة بين المدن")
    display_plot(all_cities_forecast_chart(all_cities_filtered))

    col1, col2 = st.columns([1.55, 1])
    with col1:
        comparison_source = filtered[filtered["series"].isin(cities)].copy()
        if view_mode == "أسبوعي":
            comparison_source = comparison_source.groupby(["series"], as_index=False)["forecast"].sum()
            display_plot(weekly_city_totals_chart(comparison_source.rename(columns={"forecast": "weekly_total"})))
        else:
            display_plot(city_comparison_chart(comparison_source, chart_mode))
    with col2:
        totals_frame = filtered[filtered["series"].isin(cities)].groupby("series", as_index=False)["forecast"].sum().rename(columns={"forecast": "weekly_total"})
        display_plot(weekly_city_totals_chart(totals_frame))

    col1, col2 = st.columns(2)
    with col1:
        display_plot(daily_heatmap(filtered[filtered["series"].isin(cities)]))
    with col2:
        distribution = weekly_summary_metrics(bundle)
        if not distribution.empty:
            distribution = distribution[distribution["series"].isin(MAJOR_CITIES + [ALL_CITIES_SERIES])].copy()
            other_total = other_cities_weekly_estimate(bundle)
            dist_rows = distribution[distribution["series"].isin(MAJOR_CITIES)][["series", "weekly_total"]].copy()
            if other_total is not None:
                dist_rows.loc[len(dist_rows)] = [OTHER_CITIES_LABEL, other_total]
            display_plot(forecast_distribution_chart(dist_rows))
            st.caption("ملاحظة: `كل المدن` موديل مستقل وقد لا يساوي تمامًا مجموع Forecast المدن الأربع.")

    section_title("أبرز الاستنتاجات")
    if peak_day is not None:
        insight_box(f"أعلى يوم متوقع في موديل كل المدن هو {format_date(peak_day['date'])} بقيمة {format_int(peak_day['forecast'])} طلب.")
    if not top_city_totals.empty:
        top_row = top_city_totals.iloc[0]
        insight_box(f"أعلى مدينة متوقعة خلال الفترة المختارة هي {top_row['series']} بإجمالي {format_int(top_row['forecast'])} طلب.")
    if other_cities_weekly_estimate(bundle) is not None:
        insight_box(f"تقدير مساهمة المدن الأخرى خلال الأسبوع يبلغ {format_int(other_cities_weekly_estimate(bundle))} طلب.", "warning")


def render_city_forecasts_page(bundle):
    period_start, period_end = forecast_period(bundle)
    page_header(
        "توقعات المدن الرئيسية",
        "عرض تفصيلي لكل مدينة مع التوقع اليومي ونتائج Test وValidation ومقارنة الأداء مع Baseline.",
        [("فترة التوقع", f"{format_date(period_start)} إلى {format_date(period_end)}"), ("المدن المتاحة", "الرياض، الشرقية، جدة، الأحساء")],
    )
    selected_city = st.selectbox("اختر المدينة", options=MAJOR_CITIES)
    city_df = city_forecast_table(bundle, selected_city)
    metrics_df = model_metrics(bundle)
    metric_row = metrics_df[metrics_df["series"] == selected_city].iloc[0] if not metrics_df.empty and selected_city in metrics_df["series"].values else None
    test_df = bundle.get("test")
    validation_df = bundle.get("validation")
    city_test = test_df[test_df["series"] == selected_city].sort_values("date") if not test_df.empty else pd.DataFrame()
    city_validation = validation_df[validation_df["series"] == selected_city].sort_values("date") if not validation_df.empty else pd.DataFrame()
    if city_df.empty:
        st.warning("لا توجد بيانات Forecast لهذه المدينة.")
        return

    header_cols = st.columns(4)
    header_cols[0].metric("إجمالي Forecast الأسبوع", format_int(city_df["forecast"].sum()))
    header_cols[1].metric("المتوسط اليومي", format_float(city_df["forecast"].mean()))
    header_cols[2].metric("أعلى يوم", f"{format_date(city_df.loc[city_df['forecast'].idxmax(), 'date'])}", format_int(city_df["forecast"].max()))
    header_cols[3].metric("أقل يوم", f"{format_date(city_df.loc[city_df['forecast'].idxmin(), 'date'])}", format_int(city_df["forecast"].min()))

    perf_cols = st.columns(4)
    perf_cols[0].metric("Test WAPE", format_percent(metric_row["test_wape"]) if metric_row is not None else "غير متاح")
    perf_cols[1].metric("Baseline WAPE", format_percent(metric_row["baseline_wape"]) if metric_row is not None else "غير متاح")
    perf_cols[2].metric("Better than baseline", status_label(metric_row["better_than_baseline"]) if metric_row is not None else "غير متاح")
    perf_cols[3].metric("Bias", bias_label(metric_row["test_bias"]) if metric_row is not None else "غير متاح")

    display_plot(city_forecast_area_chart(city_df, selected_city, SERIES_COLORS[selected_city]))

    section_title("جدول التوقع اليومي")
    table = city_df[["date", "day_name_ar", "forecast", "diff_from_previous", "pct_change", "rank_in_week"]].copy()
    table.columns = ["التاريخ", "اسم اليوم", "الطلبات المتوقعة", "الفرق عن اليوم السابق", "نسبة التغير", "الترتيب داخل الأسبوع"]
    styled = table.style.format(
        {
            "التاريخ": lambda x: format_date(x),
            "الطلبات المتوقعة": lambda x: format_int(x),
            "الفرق عن اليوم السابق": lambda x: format_int(x),
            "نسبة التغير": lambda x: format_percent(x),
            "الترتيب داخل الأسبوع": lambda x: format_int(x),
        },
        na_rep="غير متاح",
    )
    st.dataframe(styled, use_container_width=True, hide_index=True)
    st.download_button("تحميل Forecast المدينة", to_csv_download(table), f"{selected_city}_forecast.csv", "text/csv", use_container_width=True)

    section_title("التحقق من أداء الموديل")
    col1, col2 = st.columns(2)
    with col1:
        if not city_test.empty:
            display_plot(actual_vs_predicted_chart(city_test, f"Test Actual vs Predicted - {selected_city}"))
            display_plot(error_bar_chart(city_test, f"Daily Error - Test - {selected_city}"))
        else:
            st.info("لا توجد بيانات Test لهذه المدينة.")
    with col2:
        if not city_validation.empty:
            display_plot(actual_vs_predicted_chart(city_validation, f"Validation Actual vs Predicted - {selected_city}"))
            display_plot(absolute_error_chart(city_test if not city_test.empty else city_validation, f"Absolute Error - {selected_city}"))
        else:
            st.info("لا توجد بيانات Validation لهذه المدينة.")

    if metric_row is not None:
        improvement = metric_row["improvement"]
        if pd.notna(improvement) and improvement > 0:
            insight_box(f"الموديل أفضل من Baseline بفارق {format_percent(improvement)} في Test WAPE.")
        else:
            insight_box("الموديل لم يتفوق على Baseline في Test WAPE.", "warning")
        insight_box(f"تصنيف WAPE الحالي: {classify_wape(metric_row['test_wape'])}. هذا التصنيف إرشادي وليس معيارًا عالميًا ثابتًا.")


def render_all_cities_page(bundle):
    comparison = all_cities_comparison(bundle)
    all_city_df = city_forecast_table(bundle, ALL_CITIES_SERIES)
    metrics_df = model_metrics(bundle)
    metric_row = metrics_df[metrics_df["series"] == ALL_CITIES_SERIES].iloc[0] if not metrics_df.empty and ALL_CITIES_SERIES in metrics_df["series"].values else None
    page_header(
        "Forecast كل المدن",
        "صفحة مخصصة لموديل كل المدن مع مقارنة مباشرة مع مجموع الرياض والشرقية وجدة والأحساء.",
        [("فترة التوقع", f"{format_date(all_city_df['date'].min())} إلى {format_date(all_city_df['date'].max())}" if not all_city_df.empty else "غير متاح")],
    )
    if all_city_df.empty:
        st.warning("لا توجد بيانات لموديل كل المدن.")
        return
    kpis = st.columns(4)
    kpis[0].metric("إجمالي Forecast الأسبوع", format_int(all_city_df["forecast"].sum()))
    kpis[1].metric("المتوسط اليومي", format_float(all_city_df["forecast"].mean()))
    kpis[2].metric("أعلى يوم", format_date(all_city_df.loc[all_city_df["forecast"].idxmax(), "date"]), format_int(all_city_df["forecast"].max()))
    kpis[3].metric("أقل يوم", format_date(all_city_df.loc[all_city_df["forecast"].idxmin(), "date"]), format_int(all_city_df["forecast"].min()))
    metrics_row = st.columns(3)
    metrics_row[0].metric("Model Test WAPE", format_percent(metric_row["test_wape"]) if metric_row is not None else "غير متاح")
    metrics_row[1].metric("Baseline WAPE", format_percent(metric_row["baseline_wape"]) if metric_row is not None else "غير متاح")
    metrics_row[2].metric("Forecast Bias", bias_label(metric_row["test_bias"]) if metric_row is not None else "غير متاح")

    display_plot(all_cities_forecast_chart(all_city_df))
    section_title("المقارنة مع مجموع المدن الأربع")
    if comparison.empty:
        st.info("لا توجد بيانات كافية لبناء المقارنة.")
        return
    col1, col2 = st.columns(2)
    with col1:
        display_plot(all_cities_comparison_chart(comparison))
    with col2:
        display_plot(difference_bar_chart(comparison))
    summary = comparison.copy()
    summary.columns = ["التاريخ", "Forecast كل المدن", "مجموع المدن الأربع", "الفرق", "نسبة الفرق", "Other Cities"]
    st.dataframe(replace_nan_for_display(summary), use_container_width=True, hide_index=True)
    st.download_button("تحميل جدول المقارنة", to_csv_download(summary), "all_cities_comparison.csv", "text/csv", use_container_width=True)

    weekly_other = comparison["other_cities"].sum(min_count=1)
    if pd.notna(weekly_other) and weekly_other >= 0:
        share = weekly_other / all_city_df["forecast"].sum() * 100 if all_city_df["forecast"].sum() else None
        insight_box(f"تقدير Other Cities الأسبوعي = {format_int(weekly_other)} طلب، وبحصة {format_percent(share)} من Forecast كل المدن.")
    else:
        insight_box("نتيجة Other Cities أصبحت سالبة في بعض الأيام، لذلك يجب تفسيرها بحذر.", "warning")
    st.caption("هذا الفرق لا يعني خطأ بالضرورة، لأن موديل `كل المدن` تم تدريبه بشكل مستقل وقد يشمل مدنًا أخرى.")


def render_model_performance_page(bundle, controls):
    metrics_df = model_metrics(bundle)
    page_header(
        "أداء الموديلات",
        "استخدام مباشر لملف metrics الحقيقي لتقييم الدقة والتحسن مقابل Baseline لكل سلسلة.",
        [("عدد السلاسل", format_int(len(metrics_df)))],
    )
    if metrics_df.empty:
        st.warning("ملف metrics غير متاح.")
        return
    best_wape = metrics_df.sort_values("test_wape").iloc[0]
    best_mae = metrics_df.sort_values("test_mae").iloc[0]
    best_improvement = metrics_df.sort_values("improvement", ascending=False).iloc[0]
    better_count = int((metrics_df["better_than_baseline"] == "نعم").sum())
    needs_improvement = int((metrics_df["test_wape"] >= 30).sum())

    cols = st.columns(5)
    with cols[0]:
        inject_metric_card("Best Test WAPE", f"{best_wape['series']} | {format_percent(best_wape['test_wape'])}", "", TEAL)
    with cols[1]:
        inject_metric_card("Best MAE", f"{best_mae['series']} | {format_float(best_mae['test_mae'])}", "", BLUE)
    with cols[2]:
        inject_metric_card("Largest improvement", f"{best_improvement['series']} | {format_percent(best_improvement['improvement'])}", "", GREEN)
    with cols[3]:
        inject_metric_card("Better than baseline", format_int(better_count), "عدد الموديلات", ORANGE)
    with cols[4]:
        inject_metric_card("Need improvement", format_int(needs_improvement), "Test WAPE >= 30%", RED)

    section_title("الرسوم")
    col1, col2 = st.columns(2)
    with col1:
        display_plot(single_metric_bar(metrics_df, "test_wape", "Test WAPE حسب السلسلة"))
    with col2:
        display_plot(wape_vs_baseline_chart(metrics_df))
    col1, col2 = st.columns(2)
    with col1:
        display_plot(single_metric_bar(metrics_df, "test_mae", "MAE Comparison"))
    with col2:
        display_plot(single_metric_bar(metrics_df, "test_rmse", "RMSE Comparison"))
    col1, col2 = st.columns(2)
    with col1:
        display_plot(bias_chart(metrics_df))
    with col2:
        display_plot(historical_volume_scatter(metrics_df))

    section_title("جدول الترتيب", "تصنيف WAPE إرشادي: أقل من 10 ممتاز، 10-20 جيد، 20-30 مقبول بحذر، 30+ يحتاج تحسين")
    ranking_columns = [
        "series",
        "test_mae",
        "test_rmse",
        "test_wape",
        "baseline_wape",
        "improvement",
        "improvement_pct",
        "test_bias",
        "better_than_baseline",
        "best_epoch",
        "historical_total",
        "historical_daily_avg",
    ]
    available_ranking_columns = [column for column in ranking_columns if column in metrics_df.columns]
    ranking = metrics_df[available_ranking_columns].copy()
    ranking["wape_classification"] = ranking["test_wape"].apply(classify_wape)
    rename_map = {
        "series": "السلسلة",
        "test_mae": "Test MAE",
        "test_rmse": "Test RMSE",
        "test_wape": "Test WAPE",
        "baseline_wape": "Baseline WAPE",
        "improvement": "Improvement",
        "improvement_pct": "Improvement %",
        "test_bias": "Bias",
        "better_than_baseline": "أفضل من Baseline",
        "best_epoch": "Best Epoch",
        "historical_total": "Historical Total Orders",
        "historical_daily_avg": "Average Daily Historical Orders",
        "wape_classification": "تصنيف WAPE",
    }
    ranking = ranking.rename(columns=rename_map)
    st.dataframe(replace_nan_for_display(ranking), use_container_width=True, hide_index=True)
    st.download_button("تحميل Ranking table", to_csv_download(ranking), "model_ranking.csv", "text/csv", use_container_width=True)


def render_actual_vs_predicted_page(bundle, controls):
    combined = bundle.get("combined_results")
    page_header("Actual vs Predicted", "مقارنة القيم الفعلية والمتوقعة في ملفات Test وValidation مع فلاتر مباشرة.", None)
    if combined.empty:
        st.warning("لا توجد بيانات Test أو Validation.")
        return
    series_options = available_series(bundle)
    default_index = series_options.index(controls["series_selection"]) if controls["series_selection"] in series_options else 0
    col1, col2, col3 = st.columns(3)
    with col1:
        series = st.selectbox("Series", options=series_options, index=default_index)
    with col2:
        dataset = st.selectbox("Dataset", options=["Test", "Validation"], index=0 if controls["dataset"] == "Test" else 1)
    with col3:
        subset = combined[(combined["series"] == series) & (combined["data_type"] == dataset)].sort_values("date")
        date_range = st.date_input(
            "Date range",
            value=(subset["date"].min().to_pydatetime(), subset["date"].max().to_pydatetime()) if not subset.empty else (),
            min_value=subset["date"].min().to_pydatetime() if not subset.empty else None,
            max_value=subset["date"].max().to_pydatetime() if not subset.empty else None,
        )
    filtered = subset.copy()
    if isinstance(date_range, tuple) and len(date_range) == 2:
        filtered = filtered[(filtered["date"] >= pd.Timestamp(date_range[0])) & (filtered["date"] <= pd.Timestamp(date_range[1]))]
    if filtered.empty:
        st.info("لا توجد بيانات للفلاتر الحالية.")
        return

    mae = (filtered["actual"] - filtered["forecast"]).abs().mean()
    largest_over = filtered.loc[filtered["error"].idxmin()]
    largest_under = filtered.loc[filtered["error"].idxmax()]
    largest_abs = filtered.loc[filtered["abs_error"].idxmax()]
    kpi_cols = st.columns(6)
    kpi_cols[0].metric("Average Actual", format_float(filtered["actual"].mean()))
    kpi_cols[1].metric("Average Predicted", format_float(filtered["forecast"].mean()))
    kpi_cols[2].metric("MAE", format_float(mae))
    kpi_cols[3].metric("Largest over-forecast", format_float(abs(largest_over["error"])))
    kpi_cols[4].metric("Largest under-forecast", format_float(abs(largest_under["error"])))
    kpi_cols[5].metric("Largest absolute error date", format_date(largest_abs["date"]))

    col1, col2 = st.columns(2)
    with col1:
        display_plot(actual_vs_predicted_chart(filtered, f"{dataset} Actual vs Predicted - {series}"))
    with col2:
        display_plot(error_bar_chart(filtered, f"{dataset} Error - {series}"))
    col1, col2 = st.columns(2)
    with col1:
        display_plot(absolute_error_chart(filtered, f"{dataset} Absolute Error - {series}"))
    with col2:
        display_plot(actual_predicted_scatter(filtered, f"{dataset} Scatter - {series}"))

    export_df = filtered[["date", "day_name_ar", "actual", "forecast", "error", "abs_error"]].copy()
    export_df.columns = ["التاريخ", "اسم اليوم", "Actual", "Predicted", "الخطأ", "الخطأ المطلق"]
    st.dataframe(replace_nan_for_display(export_df), use_container_width=True, hide_index=True)
    st.download_button("تحميل CSV المفلتر", to_csv_download(export_df), f"{series}_{dataset}_filtered.csv", "text/csv", use_container_width=True)


def render_data_details_page(bundle):
    page_header("تفاصيل البيانات", "كل الجوانب التقنية الخاصة بالملفات وجودة البيانات أصبحت هنا بدل الواجهة التنفيذية.", None)
    labels = {
        "forecast": "Forecast",
        "presentation": "Presentation Forecast",
        "weekly_summary": "Weekly Summary",
        "validation": "Validation Results",
        "test": "Test Results",
        "metrics": "Metrics",
        "training_summary": "Training Summary",
    }
    tabs = st.tabs(list(labels.values()))
    for (key, label), tab in zip(labels.items(), tabs):
        with tab:
            frame = bundle.get(key)
            with st.expander(f"{label} - ملخص البيانات", expanded=True):
                st.write(f"اسم الملف: `{FILE_MAP[key]}`")
                st.write(f"تم التحميل: {'نعم' if key in bundle.loaded_files else 'لا'}")
                st.write(f"عدد الصفوف: {format_int(len(frame))}")
                st.write(f"عدد الأعمدة: {format_int(len(frame.columns))}")
                st.write(f"القيم المفقودة: {format_int(frame.isna().sum().sum()) if not frame.empty else '0'}")
                st.write(f"الصفوف المكررة: {format_int(frame.duplicated().sum()) if not frame.empty else '0'}")
                if "date" in frame.columns and not frame.empty and not frame["date"].dropna().empty:
                    st.write(f"الفترة الزمنية: {format_date(frame['date'].min())} إلى {format_date(frame['date'].max())}")
            with st.expander("معاينة البيانات", expanded=False):
                st.dataframe(replace_nan_for_display(frame.head(50)), use_container_width=True, hide_index=True)
            if not frame.empty:
                st.download_button(f"تحميل {label}", to_csv_download(frame), f"{key}.csv", "text/csv", use_container_width=True, key=f"download-{key}")

    sheets = {name: bundle.get(name) for name in FILE_MAP if not bundle.get(name).empty}
    if sheets:
        excel_bytes = build_excel_file(sheets)
        if excel_bytes:
            st.download_button(
                "تحميل ملف Excel متعدد الصفحات",
                excel_bytes,
                "forecast_dashboard_export.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True,
            )
        else:
            st.info("تصدير Excel غير متاح لأن `xlsxwriter` و`openpyxl` غير مثبتين في البيئة الحالية. يمكن متابعة استخدام تنزيلات CSV بدون مشكلة.")


def render_methodology_page():
    page_header("منهجية العمل", "شرح مختصر وعملي لطبيعة السلاسل والموديلات وكيفية تفسير النتائج.", None)
    st.markdown(
        """
        ### السلاسل المدربة
        الرياض، الشرقية، جدة، الأحساء، وكل المدن.

        ### فكرة الموديل
        يعتمد النهج على `Conv1D` لالتقاط الأنماط المحلية، ثم `Stacked LSTM` لتعلم العلاقات الزمنية، مع خصائص تقويمية مثل يوم الأسبوع والشهر، ثم Forecast تكراري لمدة 7 أيام.

        ### تقسيم البيانات
        تم استخدام Training وValidation وTest لتقييم الأداء قبل إخراج Forecast الأسبوع التالي.

        ### مؤشرات التقييم
        `MAE` لقياس متوسط الخطأ المطلق، و`RMSE` لإعطاء وزن أكبر للأخطاء الكبيرة، و`WAPE` لربط الخطأ بحجم الطلب، و`Bias` لفهم اتجاه الانحياز، مع المقارنة دائمًا ضد `Seasonal Naive Baseline`.

        ### ملاحظات مهمة
        Forecast ليس قيمة مؤكدة بل تقدير مبني على النمط التاريخي. كما أن موديل `كل المدن` مستقل، وليس مجرد مجموع مباشر لموديلات المدن الأربع.
        """
    )


load_styles()
bundle = load_data_bundle()
controls = sidebar_controls(bundle)

selected_page = controls["page"]
if selected_page == PAGE_LABELS["executive"]:
    render_executive_page(bundle, controls)
elif selected_page == PAGE_LABELS["cities"]:
    render_city_forecasts_page(bundle)
elif selected_page == PAGE_LABELS["all_cities"]:
    render_all_cities_page(bundle)
elif selected_page == PAGE_LABELS["performance"]:
    render_model_performance_page(bundle, controls)
elif selected_page == PAGE_LABELS["methodology"]:
    render_methodology_page()
