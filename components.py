from __future__ import annotations

import streamlit as st

from utils import format_date, format_float, format_int, format_percent


def inject_metric_card(title: str, value: str, subtitle: str = "", accent: str = "#12304A"):
    st.markdown(
        f"""
        <div class="metric-card" style="border-top: 4px solid {accent};">
            <div class="metric-title">{title}</div>
            <div class="metric-value">{value}</div>
            <div class="metric-subtitle">{subtitle}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def page_header(title: str, subtitle: str, meta_items: list[tuple[str, str]] | None = None):
    meta_html = ""
    if meta_items:
        meta_html = "".join(
            f'<div class="header-meta-item"><span>{label}</span><strong>{value}</strong></div>'
            for label, value in meta_items
        )
    st.markdown(
        f"""
        <section class="page-header">
            <div class="page-header-main">
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
            <div class="header-meta">{meta_html}</div>
        </section>
        """,
        unsafe_allow_html=True,
    )


def section_title(title: str, note: str = ""):
    note_html = f'<span class="section-note">{note}</span>' if note else ""
    st.markdown(f'<div class="section-title">{title}{note_html}</div>', unsafe_allow_html=True)


def insight_box(text: str, tone: str = "info"):
    st.markdown(f'<div class="insight-box {tone}">{text}</div>', unsafe_allow_html=True)
