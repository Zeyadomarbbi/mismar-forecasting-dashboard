import { ChartCard } from "@/components/charts/chart-card";
import {
  AllCitiesForecastChart,
  ComparisonLineChart,
  DifferenceBarChart,
} from "@/components/charts/dashboard-charts";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/cards/kpi-card";
import { SimpleDataTable } from "@/components/tables/simple-data-table";
import { loadDashboardDatasets } from "@/lib/csv/load-datasets";
import {
  buildDailyComparison,
  getAllCitiesSummary,
  getForecastDateRange,
  getOtherCitiesWeeklyEstimate,
} from "@/lib/analytics";
import { ALL_CITIES_LABEL } from "@/lib/constants";
import { formatDateLabel, formatNumber, formatPercent } from "@/lib/formatting";

export default async function AllCitiesPage() {
  const datasets = await loadDashboardDatasets();
  const allCitiesRows = datasets.forecast.filter((row) => row.series === ALL_CITIES_LABEL);
  const summary = getAllCitiesSummary(datasets.forecast);
  const comparison = buildDailyComparison(datasets.forecast);
  const range = getForecastDateRange(allCitiesRows);
  const weeklyDifference = comparison.reduce((sum, row) => sum + row.difference, 0);
  const weeklyPct =
    comparison.reduce((sum, row) => sum + row.fourCitiesForecast, 0) === 0
      ? null
      : (weeklyDifference /
          comparison.reduce((sum, row) => sum + row.fourCitiesForecast, 0)) *
        100;
  const otherCities = getOtherCitiesWeeklyEstimate(datasets.forecast);

  return (
    <>
      <PageHeader
        title="توقع كل المدن"
        description="صفحة مخصصة لعرض Forecast كل المدن خلال الأسبوع القادم مع مقارنة تشغيلية بمجموع المدن الأربع."
        meta={[
          { label: "فترة التوقع", value: `${formatDateLabel(range.start)} إلى ${formatDateLabel(range.end)}` },
        ]}
      />

      <section className="section-grid md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="إجمالي Forecast الأسبوع" value={formatNumber(summary.weeklyTotal, 0)} />
        <KpiCard title="المتوسط اليومي" value={formatNumber(summary.dailyAverage, 2)} />
        <KpiCard title="أعلى يوم" value={formatDateLabel(summary.peak?.date)} subtitle={formatNumber(summary.peak?.forecastOrders ?? null, 0)} />
        <KpiCard title="أقل يوم" value={formatDateLabel(summary.low?.date)} subtitle={formatNumber(summary.low?.forecastOrders ?? null, 0)} />
      </section>

      <div className="mt-5 grid gap-5">
        <ChartCard title="Forecast كل المدن خلال 7 أيام" subtitle="الرسم الرئيسي للتوقعات اليومية.">
          <AllCitiesForecastChart data={allCitiesRows} />
        </ChartCard>

        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard title="مقارنة كل المدن مع مجموع المدن الأربع" subtitle="يوضح الفرق بين الموديل الكلي والمجموع الجزئي للمدن الرئيسية.">
            <ComparisonLineChart data={comparison} />
          </ChartCard>
          <ChartCard title="الفروقات اليومية" subtitle="الفروق قد تعكس استقلالية تدريب الموديلات ولا تعني خطأ بالضرورة.">
            <DifferenceBarChart data={comparison} />
          </ChartCard>
        </div>

        <section className="section-grid md:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="الفرق الأسبوعي" value={formatNumber(weeklyDifference, 0)} />
          <KpiCard title="الفرق الأسبوعي %" value={formatPercent(weeklyPct)} />
          <KpiCard title="Other Cities الأسبوعي" value={formatNumber(otherCities, 0)} subtitle={otherCities === null ? "يوجد تباين سلبي أو غير منطقي" : "عند صلاحية الحساب"} />
          <KpiCard
            title="حصة Other Cities"
            value={otherCities !== null && summary.weeklyTotal > 0 ? formatPercent((otherCities / summary.weeklyTotal) * 100) : "غير متاح"}
          />
        </section>

        <ChartCard title="جدول المقارنة اليومية">
          <SimpleDataTable
            columns={[
              "التاريخ",
              "اسم اليوم",
              "Forecast كل المدن",
              "مجموع المدن الأربع",
              "الفرق",
              "نسبة الفرق",
              "Other Cities",
            ]}
            rows={comparison.map((row) => ({
              "التاريخ": row.date,
              "اسم اليوم": row.dayNameAr,
              "Forecast كل المدن": formatNumber(row.allCitiesForecast, 0),
              "مجموع المدن الأربع": formatNumber(row.fourCitiesForecast, 0),
              "الفرق": formatNumber(row.difference, 0),
              "نسبة الفرق": formatPercent(row.differencePct),
              "Other Cities": formatNumber(row.otherCitiesForecast, 0),
            }))}
          />
          <p className="mt-4 text-sm leading-7 text-muted">
            موديل <span className="font-bold text-navy">كل المدن</span> تم تدريبه بشكل مستقل، لذلك قد يختلف عن مجموع موديلات المدن الأربع.
          </p>
        </ChartCard>
      </div>
    </>
  );
}
