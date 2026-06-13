import { format } from "date-fns";
import { ARABIC_DAY_MAP } from "@/lib/constants";

export function arabicWeekdayFromDate(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "غير متاح";
  }
  const dayName = format(date, "EEEE");
  return ARABIC_DAY_MAP[dayName] ?? dayName;
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "غير متاح";
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "غير متاح";
  }
  return `${formatNumber(value, 2)}%`;
}

export function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "غير متاح";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "غير متاح";
  }
  return format(date, "yyyy-MM-dd");
}

export function safeText(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "غير متاح";
  }
  return String(value);
}

export function toCsvBom(content: string): string {
  return `\uFEFF${content}`;
}
