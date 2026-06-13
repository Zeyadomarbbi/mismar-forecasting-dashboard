import {
  buildDailyComparison,
  getOtherCitiesWeeklyEstimate,
  withMetricImprovements,
} from "@/lib/analytics";
import { arabicWeekdayFromDate } from "@/lib/formatting";
import { parseForecastRows } from "@/lib/csv/parse";

describe("analytics helpers", () => {
  it("maps weekdays to Arabic explicitly", () => {
    expect(arabicWeekdayFromDate("2026-06-15")).toBe("الاثنين");
    expect(arabicWeekdayFromDate("2026-06-14")).toBe("الأحد");
  });

  it("calculates Other Cities safely", () => {
    const rows = [
      { series: "كل المدن", date: "2026-06-14", dayNameAr: "الأحد", forecastOrders: 100 },
      { series: "الرياض", date: "2026-06-14", dayNameAr: "الأحد", forecastOrders: 40 },
      { series: "الشرقية", date: "2026-06-14", dayNameAr: "الأحد", forecastOrders: 20 },
      { series: "جدة", date: "2026-06-14", dayNameAr: "الأحد", forecastOrders: 10 },
      { series: "الأحساء", date: "2026-06-14", dayNameAr: "الأحد", forecastOrders: 5 },
    ];
    const comparison = buildDailyComparison(rows as never);
    expect(comparison[0]?.difference).toBe(25);
    expect(getOtherCitiesWeeklyEstimate(rows as never)).toBe(25);
  });

  it("calculates WAPE improvement percentage", () => {
    const rows = withMetricImprovements([
      {
        series: "الرياض",
        baselineWape: 50,
        testWape: 40,
      },
    ] as never);
    expect(rows[0]?.improvement).toBe(10);
    expect(rows[0]?.improvementPct).toBe(20);
  });

  it("normalizes forecast CSV structure", () => {
    const csv = "\uFEFFالسلسلة,اليوم,الطلبات المتوقعة\nالرياض,2026-06-14,10";
    const parsed = parseForecastRows(csv);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.series).toBe("الرياض");
    expect(parsed.rows[0]?.forecastOrders).toBe(10);
  });
});
