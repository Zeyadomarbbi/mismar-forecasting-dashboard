import { ChartCard } from "@/components/charts/chart-card";
import { KpiCard } from "@/components/cards/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { loadDashboardDatasets } from "@/lib/csv/load-datasets";
import {
  addOtherCitiesDistribution,
  getAllCitiesSummary,
  getCitySummaries,
  getForecastDateRange,
  getTopCity,
} from "@/lib/analytics";
import { ALL_CITIES_LABEL } from "@/lib/constants";
import { formatDateLabel, formatNumber } from "@/lib/formatting";

export default async function WeeklySummaryPage() {
  const datasets = await loadDashboardDatasets();
  const range = getForecastDateRange(datasets.forecast);
  const allCitiesSummary = getAllCitiesSummary(datasets.forecast);
  const citySummaries = getCitySummaries(datasets.forecast);
  const topCity = getTopCity(datasets.forecast);
  const distributionRows = addOtherCitiesDistribution(datasets.weeklySummary);
  const allCitiesRows = datasets.forecast.filter(
    (row) => row.series === ALL_CITIES_LABEL
  );

  return (
    <>
      <PageHeader
        title="ملخص الأسبوع القادم"
        description="صفحة مبسطة تركز فقط على Forecast الأيام السبعة القادمة، بدون أي مقارنات فعلية أو صفحات تقييم أداء."
        meta={[
          {
            label: "فترة التوقع",
            value: `${formatDateLabel(range.start)} إلى ${formatDateLabel(
              range.end
            )}`,
          },
          { label: "مصدر الأرقام", value: "01 و03 CSV" },
          { label: "النطاق", value: "الأسبوع القادم فقط" },
        ]}
      />

      <section className="section-grid md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="إجمالي Forecast كل المدن"
          value={formatNumber(allCitiesSummary.weeklyTotal, 0)}
          subtitle="إجمالي الأسبوع"
        />
        <KpiCard
          title="المتوسط اليومي"
          value={formatNumber(allCitiesSummary.dailyAverage, 2)}
          subtitle="لموديل كل المدن"
        />
        <KpiCard
          title="أعلى مدينة"
          value={topCity?.series ?? "غير متاح"}
          subtitle={topCity ? `${formatNumber(topCity.weeklyTotal, 0)} طلب` : "غير متاح"}
        />
        <KpiCard
          title="عدد الأيام"
          value={formatNumber(allCitiesRows.length, 0)}
          subtitle="في ملف Forecast"
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <ChartCard
          title="خطة الأيام السبعة القادمة"
          subtitle="ملخص يومي لموديل كل المدن من ملف Forecast الأسبوعي."
        >
          <div className="space-y-4">
            {allCitiesRows.map((row) => (
              <div
                key={`${row.date}-${row.dayNameAr}`}
                className="rounded-2xl border border-border bg-bg p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-navy">{row.dayNameAr}</div>
                    <div className="text-xs text-muted numbers-ltr">
                      {formatDateLabel(row.date)}
                    </div>
                  </div>
                  <div className="text-lg font-extrabold text-navy numbers-ltr">
                    {formatNumber(row.forecastOrders, 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="ملخص المدن"
          subtitle="إجمالي Forecast الأسبوعي لكل مدينة رئيسية."
        >
          <div className="space-y-3 text-sm leading-7 text-muted">
            {citySummaries.map((summary) => (
              <div
                key={summary.series}
                className="rounded-2xl border border-border bg-bg px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-navy">{summary.series}</span>
                  <span className="font-bold text-navy numbers-ltr">
                    {formatNumber(summary.weeklyTotal, 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        {distributionRows.map((row) => (
          <ChartCard
            key={row.series}
            title={row.series}
            subtitle="إجمالي الأسبوع من ملف الملخص الأسبوعي."
          >
            <p className="text-2xl font-extrabold text-navy numbers-ltr">
              {formatNumber(row.weeklyForecastTotal, 0)}
            </p>
          </ChartCard>
        ))}
      </div>
    </>
  );
}
