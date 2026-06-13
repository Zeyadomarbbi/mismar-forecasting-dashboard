from __future__ import annotations

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from utils import (
    ALL_CITIES_SERIES,
    BLUE,
    GRAY,
    NAVY,
    RED,
    SERIES_COLORS,
    TEAL,
    WEEKDAY_ORDER_AR,
    format_int,
)

PLOT_BG = "#FFFFFF"
GRID = "#E2E8F0"


def hex_to_rgba(hex_color: str, alpha: float) -> str:
    color = hex_color.lstrip("#")
    if len(color) != 6:
        return f"rgba(15, 139, 141, {alpha})"
    r = int(color[0:2], 16)
    g = int(color[2:4], 16)
    b = int(color[4:6], 16)
    return f"rgba({r}, {g}, {b}, {alpha})"


def apply_layout(fig: go.Figure, title: str, height: int = 420, horizontal_legend: bool = True) -> go.Figure:
    legend_config = (
        dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="center",
            x=0.5,
            font=dict(size=11, color=NAVY),
            itemwidth=40,
        )
        if horizontal_legend
        else dict(font=dict(size=11, color=NAVY))
    )
    fig.update_layout(
        template="plotly_white",
        title=dict(text=title, font=dict(color=NAVY, size=17), x=0.5, xanchor="center", y=0.96),
        paper_bgcolor=PLOT_BG,
        plot_bgcolor=PLOT_BG,
        font=dict(family="Cairo, Tajawal, sans-serif", color=NAVY, size=12),
        margin=dict(l=28, r=28, t=92, b=52),
        height=height,
        hovermode="x unified",
        legend=legend_config,
        uniformtext_minsize=9,
        uniformtext_mode="hide",
        hoverlabel=dict(font=dict(family="Cairo, Tajawal, sans-serif", size=12), bgcolor="#FFFFFF", bordercolor=GRID, font_color=NAVY),
    )
    fig.update_annotations(font=dict(family="Cairo, Tajawal, sans-serif", size=11, color=NAVY), align="center")
    fig.update_xaxes(
        showgrid=False,
        zeroline=False,
        linecolor=GRID,
        tickfont=dict(color=NAVY, size=11),
        title_font=dict(color=NAVY, size=12),
        automargin=True,
        tickangle=0,
    )
    fig.update_yaxes(
        showgrid=True,
        gridcolor=GRID,
        zeroline=False,
        tickfont=dict(color=NAVY, size=11),
        title_font=dict(color=NAVY, size=12),
        automargin=True,
    )
    return fig


def all_cities_forecast_chart(df: pd.DataFrame) -> go.Figure:
    ordered = df.sort_values("date").copy()
    weekly_total = ordered["forecast"].sum()
    peak = ordered.loc[ordered["forecast"].idxmax()]
    low = ordered.loc[ordered["forecast"].idxmin()]
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=ordered["date"],
            y=ordered["forecast"],
            mode="lines+markers+text",
            name="كل المدن",
            line=dict(color=TEAL, width=4),
            marker=dict(size=10, color=TEAL),
            text=[format_int(value) for value in ordered["forecast"]],
            textposition="top center",
            hovertemplate="التاريخ: %{x|%Y-%m-%d}<br>اليوم: %{customdata[0]}<br>Forecast: %{y:,.0f}<extra></extra>",
            customdata=ordered[["day_name_ar"]].values,
        )
    )
    fig.add_annotation(x=peak["date"], y=peak["forecast"], text=f"أعلى يوم: {format_int(peak['forecast'])}", showarrow=True, arrowcolor=TEAL)
    fig.add_annotation(x=low["date"], y=low["forecast"], text=f"أقل يوم: {format_int(low['forecast'])}", showarrow=True, arrowcolor=GRAY, yshift=-30)
    title = f"Forecast كل المدن خلال 7 أيام المقبلة<br><sup>إجمالي الأسبوع: {format_int(weekly_total)} طلب</sup>"
    return apply_layout(fig, title, height=520)


def city_comparison_chart(df: pd.DataFrame, mode: str = "القيم الفعلية") -> go.Figure:
    working = df.sort_values(["series", "date"]).copy()
    value_col = "forecast"
    y_title = "الطلبات المتوقعة"
    if mode == "نسبة التغير من أول يوم":
        working["base_value"] = working.groupby("series")["forecast"].transform("first")
        working["percent_change"] = ((working["forecast"] - working["base_value"]) / working["base_value"].replace(0, pd.NA)) * 100
        value_col = "percent_change"
        y_title = "نسبة التغير %"
    fig = px.line(
        working,
        x="date",
        y=value_col,
        color="series",
        color_discrete_map=SERIES_COLORS,
        markers=True,
        custom_data=["day_name_ar", "forecast"],
    )
    if mode == "القيم الفعلية":
        fig.update_traces(hovertemplate="التاريخ: %{x|%Y-%m-%d}<br>اليوم: %{customdata[0]}<br>Forecast: %{y:,.0f}<extra></extra>")
    else:
        fig.update_traces(hovertemplate="التاريخ: %{x|%Y-%m-%d}<br>اليوم: %{customdata[0]}<br>التغير: %{y:.2f}%<br>Forecast: %{customdata[1]:,.0f}<extra></extra>")
    fig.update_yaxes(title=y_title)
    return apply_layout(fig, "مقارنة Forecast بين المدن الرئيسية", height=480)


def weekly_city_totals_chart(df: pd.DataFrame) -> go.Figure:
    ordered = df.sort_values("weekly_total", ascending=True)
    fig = px.bar(
        ordered,
        x="weekly_total",
        y="series",
        orientation="h",
        color="series",
        color_discrete_map=SERIES_COLORS,
        text="weekly_total",
    )
    fig.update_traces(texttemplate="%{text:,.0f}", textposition="outside", hovertemplate="المدينة: %{y}<br>إجمالي الأسبوع: %{x:,.0f}<extra></extra>")
    fig.update_layout(margin=dict(l=70, r=40, t=92, b=30))
    return apply_layout(fig, "إجمالي الطلب المتوقع لكل مدينة", height=360)


def daily_heatmap(df: pd.DataFrame) -> go.Figure:
    pivot = (
        df.pivot_table(index="series", columns="day_name_ar", values="forecast", aggfunc="sum")
        .fillna(0)
        .reindex(columns=WEEKDAY_ORDER_AR, fill_value=0)
    )
    fig = go.Figure(
        go.Heatmap(
            z=pivot.values,
            x=pivot.columns,
            y=pivot.index,
            colorscale=[[0, "#EFF6FF"], [0.5, "#7DD3FC"], [1, "#0F8B8D"]],
            hovertemplate="المدينة: %{y}<br>اليوم: %{x}<br>Forecast: %{z:,.0f}<extra></extra>",
            colorbar=dict(title="طلبات"),
        )
    )
    return apply_layout(fig, "الطلب المتوقع يوميًا حسب المدينة", height=360)


def forecast_distribution_chart(df: pd.DataFrame) -> go.Figure:
    fig = px.pie(
        df,
        names="series",
        values="weekly_total",
        hole=0.62,
        color="series",
        color_discrete_map=SERIES_COLORS,
    )
    fig.update_traces(textposition="inside", textinfo="percent+label", textfont=dict(size=10))
    return apply_layout(fig, "توزيع Forecast الأسبوعي", height=360)


def city_forecast_area_chart(df: pd.DataFrame, city_name: str, series_color: str) -> go.Figure:
    ordered = df.sort_values("date").copy()
    peak = ordered.loc[ordered["forecast"].idxmax()]
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=ordered["date"],
            y=ordered["forecast"],
            mode="lines+markers+text",
            name=city_name,
            line=dict(color=series_color, width=3),
            fill="tozeroy",
            fillcolor=hex_to_rgba(series_color, 0.14),
            marker=dict(size=9, color=series_color),
            text=[format_int(value) for value in ordered["forecast"]],
            textposition="top center",
            textfont=dict(size=10),
            customdata=ordered[["day_name_ar"]].values,
            hovertemplate="التاريخ: %{x|%Y-%m-%d}<br>اليوم: %{customdata[0]}<br>Forecast: %{y:,.0f}<extra></extra>",
        )
    )
    fig.add_hline(y=ordered["forecast"].mean(), line_dash="dot", line_color=GRAY, annotation_text="المتوسط اليومي")
    fig.add_annotation(x=peak["date"], y=peak["forecast"], text="أعلى يوم", showarrow=True, arrowcolor=series_color)
    return apply_layout(fig, f"Forecast يومي - {city_name}", height=480)


def actual_vs_predicted_chart(df: pd.DataFrame, title: str) -> go.Figure:
    ordered = df.sort_values("date")
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=ordered["date"], y=ordered["actual"], mode="lines+markers", name="Actual", line=dict(color=NAVY, width=3)))
    fig.add_trace(go.Scatter(x=ordered["date"], y=ordered["forecast"], mode="lines+markers", name="Predicted", line=dict(color=TEAL, width=3, dash="dash")))
    return apply_layout(fig, title, height=380)


def error_bar_chart(df: pd.DataFrame, title: str) -> go.Figure:
    colors = [RED if value < 0 else TEAL for value in df["error"]]
    fig = go.Figure(go.Bar(x=df["date"], y=df["error"], marker_color=colors, text=df["error"]))
    fig.update_traces(texttemplate="%{text:,.0f}", textfont=dict(size=10), hovertemplate="التاريخ: %{x|%Y-%m-%d}<br>الخطأ: %{y:,.0f}<extra></extra>")
    return apply_layout(fig, title, height=340)


def absolute_error_chart(df: pd.DataFrame, title: str) -> go.Figure:
    fig = px.line(df, x="date", y="abs_error", markers=True)
    fig.update_traces(line=dict(color=RED, width=3), hovertemplate="التاريخ: %{x|%Y-%m-%d}<br>الخطأ المطلق: %{y:,.0f}<extra></extra>")
    return apply_layout(fig, title, height=340)


def actual_predicted_scatter(df: pd.DataFrame, title: str) -> go.Figure:
    max_value = max(df["actual"].max(), df["forecast"].max()) if not df.empty else 0
    fig = px.scatter(df, x="actual", y="forecast", color_discrete_sequence=[BLUE])
    fig.add_trace(
        go.Scatter(
            x=[0, max_value],
            y=[0, max_value],
            mode="lines",
            name="y = x",
            line=dict(color=GRAY, dash="dot"),
        )
    )
    return apply_layout(fig, title, height=360)


def wape_vs_baseline_chart(df: pd.DataFrame) -> go.Figure:
    fig = go.Figure()
    fig.add_trace(go.Bar(x=df["series"], y=df["test_wape"], name="Test WAPE", marker_color=[SERIES_COLORS.get(s, BLUE) for s in df["series"]]))
    fig.add_trace(go.Bar(x=df["series"], y=df["baseline_wape"], name="Baseline WAPE", marker_color="#CBD5E1"))
    fig.update_layout(barmode="group")
    return apply_layout(fig, "Test WAPE مقابل Baseline WAPE", height=380)


def single_metric_bar(df: pd.DataFrame, metric_column: str, title: str) -> go.Figure:
    fig = px.bar(df, x="series", y=metric_column, color="series", color_discrete_map=SERIES_COLORS, text=metric_column)
    fig.update_traces(texttemplate="%{text:.2f}", textposition="outside", textfont=dict(size=10))
    return apply_layout(fig, title, height=360)


def bias_chart(df: pd.DataFrame) -> go.Figure:
    colors = [RED if value < 0 else TEAL for value in df["test_bias"]]
    fig = go.Figure(go.Bar(x=df["series"], y=df["test_bias"], marker_color=colors, text=df["test_bias"]))
    fig.update_traces(texttemplate="%{text:.2f}", textposition="outside", textfont=dict(size=10))
    return apply_layout(fig, "Bias حسب السلسلة", height=360)


def historical_volume_scatter(df: pd.DataFrame) -> go.Figure:
    fig = px.scatter(
        df,
        x="historical_total",
        y="test_wape",
        size="historical_daily_avg",
        color="series",
        color_discrete_map=SERIES_COLORS,
        hover_data=["test_mae", "test_rmse", "improvement"],
    )
    return apply_layout(fig, "حجم البيانات التاريخية مقابل Test WAPE", height=380)


def all_cities_comparison_chart(df: pd.DataFrame) -> go.Figure:
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=df["date"], y=df["forecast_all_cities"], mode="lines+markers", name="موديل كل المدن", line=dict(color=TEAL, width=3)))
    fig.add_trace(go.Scatter(x=df["date"], y=df["forecast_major_cities"], mode="lines+markers", name="مجموع المدن الأربع", line=dict(color=BLUE, width=3)))
    return apply_layout(fig, "مقارنة Forecast كل المدن مع مجموع المدن الأربع", height=440)


def difference_bar_chart(df: pd.DataFrame) -> go.Figure:
    colors = [RED if value < 0 else TEAL for value in df["difference"]]
    fig = go.Figure(go.Bar(x=df["date"], y=df["difference"], marker_color=colors, text=df["difference"]))
    fig.update_traces(texttemplate="%{text:,.0f}", textfont=dict(size=10))
    return apply_layout(fig, "الفروقات اليومية", height=360)
