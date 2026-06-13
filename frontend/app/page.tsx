import {
  Activity,
  BarChart3,
  CalendarDays,
  Gauge,
  Map,
  Waves,
} from "lucide-react";
import { ExecutiveFilters } from "@/components/filters/executive-filters";
import { ChartCard } from "@/components/charts/chart-card";
import {
  AllCitiesForecastChart,
  CityComparisonChart,
  DistributionDonutChart,
  HeatmapGrid,
  HorizontalTotalsChart,
} from "@/components/charts/dashboard-charts";
import { InsightList } from "@/components/insights/insight-list";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/cards/kpi-card";
import { loadDashboardDatasets } from "@/lib/csv/load-datasets";
import { ALL_CITIES_LABEL, MAJOR_CITIES, SERIES_COLORS } from "@/lib/constants";
import {
  addOtherCitiesDistribution,
  averageForecast,
  executiveInsights,
  filterForecastRows,
  getAllCitiesSummary,
  getCitySummaries,
  getForecastDateRange,
  getPeakForecastRow,
  getTopCity,
  sumForecast,
} from "@/lib/analytics";
import { formatDateLabel, formatNumber } from "@/lib/formatting";

type SearchParamsShape = {
  cities?: string;
  start?: string;
  end?: string;
  view?: "values" | "change";
  display?: "daily" | "weekly";
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsShape>;
}) {
  const params = (await searchParams) ?? {};
  const datasets = await loadDashboardDatasets();
  const range = getForecastDateRange(datasets.forecast);
  const selectedCities: string[] =
    params.cities?.split(",").filter(Boolean) ?? [...MAJOR_CITIES];
  const startDate = params.start ?? range.start;
  const endDate = params.end ?? range.end;
  const viewMode = params.view === "change" ? "change" : "values";
  const displayMode = params.display === "weekly" ? "weekly" : "daily";

  const filteredForecast = filterForecastRows(
    datasets.forecast,
    [...selectedCities, ALL_CITIES_LABEL],
    startDate ?? undefined,
    endDate ?? undefined
  );
  const allCitiesSummary = getAllCitiesSummary(filteredForecast);
  const citySummaries = getCitySummaries(filteredForecast, selectedCities);
  const topCity = getTopCity(filteredForecast);
  const highestDay = getPeakForecastRow(
    filteredForecast.filter((row) => row.series === ALL_CITIES_LABEL)
  );
  const lowestDay =
    [...filteredForecast.filter((row) => row.series === ALL_CITIES_LABEL)].sort(
      (a, b) => (a.forecastOrders ?? 0) - (b.forecastOrders ?? 0)
    )[0] ?? null;
  const fourCityTotal = citySummaries.reduce(
    (sum, summary) => sum + summary.weeklyTotal,
    0
  );
  const insights = executiveInsights(datasets, filteredForecast);
  const distributionRows = addOtherCitiesDistribution(datasets.weeklySummary)
    .filter((row) => selectedCities.includes(row.series as (typeof MAJOR_CITIES)[number]) || row.series === "مدن أخرى")
    .map((row) => ({
      series: row.series,
      weeklyForecastTotal: row.weeklyForecastTotal,
    }));

  return (
    <>
      <PageHeader
        title="لوحة توقع طلبات الغسيل"
        description="يعرض هذا التطبيق التوقع خلال الأيام السبعة القادمة حسب المدن الرئيسية وموديل كل المدن، مع فلاتر واضحة ورسوم جاهزة للعرض التنفيذي."
        meta={[
          {
            label: "فترة التوقع",
            value: `${formatDateLabel(range.start)} إلى ${formatDateLabel(range.end)}`,
          },
          {
            label: "حالة البيانات",
            value: datasets.warnings.some((warning) => warning.level === "error")
              ? "يوجد تنبيه"
              : "جاهزة",
          },
        ]}
      />

      <ExecutiveFilters
        startDate={startDate ?? null}
        endDate={endDate ?? null}
        selectedCities={selectedCities}
        viewMode={viewMode}
        displayMode={displayMode}
      />

      <section className="section-grid md:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          title="إجمالي Forecast كل المدن"
          value={formatNumber(allCitiesSummary.weeklyTotal, 0)}
          subtitle="إجمالي الأسبوع"
          icon={BarChart3}
          accent={SERIES_COLORS["كل المدن"]}
        />
        <KpiCard
          title="متوسط Forecast اليومي"
          value={formatNumber(allCitiesSummary.dailyAverage, 2)}
          subtitle="لموديل كل المدن"
          icon={Gauge}
          accent={SERIES_COLORS["كل المدن"]}
        />
        <KpiCard
          title="أعلى يوم متوقع"
          value={formatDateLabel(highestDay?.date)}
          subtitle={highestDay ? `${formatNumber(highestDay.forecastOrders, 0)} طلب` : "غير متاح"}
          icon={CalendarDays}
          accent="#10233F"
        />
        <KpiCard
          title="أعلى مدينة متوقعة"
          value={topCity?.series ?? "غير متاح"}
          subtitle={topCity ? `${formatNumber(topCity.weeklyTotal, 0)} طلب` : "غير متاح"}
          icon={Map}
          accent={topCity ? SERIES_COLORS[topCity.series] : "#10233F"}
        />
        <KpiCard
          title="أقل يوم متوقع"
          value={formatDateLabel(lowestDay?.date)}
          subtitle={lowestDay ? `${formatNumber(lowestDay.forecastOrders, 0)} طلب` : "غير متاح"}
          icon={Waves}
          accent="#10233F"
        />
        <KpiCard
          title="عدد موديلات Forecast"
          value={formatNumber(datasets.weeklySummary.length, 0)}
          subtitle="السلاسل المتاحة"
          icon={Activity}
          accent="#10233F"
        />
      </section>

      <section className="section-grid mt-5 md:grid-cols-2 xl:grid-cols-4">
        {citySummaries.map((summary) => {
          const share = fourCityTotal > 0 ? (summary.weeklyTotal / fourCityTotal) * 100 : null;
          return (
            <KpiCard
              key={summary.series}
              title={summary.series}
              value={formatNumber(summary.weeklyTotal, 0)}
              subtitle={`متوسط ${formatNumber(summary.dailyAverage, 2)} | أعلى يوم ${formatNumber(summary.peak?.forecastOrders ?? null, 0)} | حصة ${share !== null ? `${share.toFixed(2)}%` : "غير متاح"}`}
              accent={SERIES_COLORS[summary.series]}
            />
          );
        })}
      </section>

      <div className="mt-5 grid gap-5">
        <ChartCard
          title="Forecast كل المدن خلال الأيام السبعة القادمة"
          subtitle={`إجمالي الأسبوع: ${formatNumber(sumForecast(filteredForecast.filter((row) => row.series === ALL_CITIES_LABEL)), 0)} طلب`}
        >
          <AllCitiesForecastChart
            data={filteredForecast
              .filter((row) => row.series === ALL_CITIES_LABEL)
              .map((row) => ({
                date: row.date,
                dayNameAr: row.dayNameAr,
                forecastOrders: row.forecastOrders,
              }))}
          />
        </ChartCard>

        <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <ChartCard
            title="مقارنة Forecast بين المدن الرئيسية"
            subtitle={
              displayMode === "weekly"
                ? "عرض إجمالي Forecast الأسبوعي لكل مدينة."
                : viewMode === "values"
                  ? "عرض القيم اليومية المتوقعة."
                  : "عرض نسبة التغير من أول يوم Forecast."
            }
          >
            {displayMode === "weekly" ? (
              <HorizontalTotalsChart
                data={citySummaries
                  .map((summary) => ({
                    series: summary.series,
                    weeklyForecastTotal: summary.weeklyTotal,
                  }))
                  .sort((a, b) => (a.weeklyForecastTotal ?? 0) - (b.weeklyForecastTotal ?? 0))}
              />
            ) : (
              <CityComparisonChart
                data={filteredForecast.filter((row) => selectedCities.includes(row.series))}
                mode={viewMode}
              />
            )}
          </ChartCard>

          <ChartCard
            title="إجمالي الطلب المتوقع لكل مدينة"
            subtitle="مرتبة تنازليًا حسب إجمالي الأسبوع."
          >
            <HorizontalTotalsChart
              data={citySummaries
                .map((summary) => ({
                  series: summary.series,
                  weeklyForecastTotal: summary.weeklyTotal,
                }))
                .sort((a, b) => (a.weeklyForecastTotal ?? 0) - (b.weeklyForecastTotal ?? 0))}
            />
          </ChartCard>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard
            title="Heatmap الطلب المتوقع"
            subtitle="الصفوف هي المدن والأعمدة هي أيام الأسبوع."
          >
            <HeatmapGrid
              rows={filteredForecast.filter((row) => selectedCities.includes(row.series))}
            />
          </ChartCard>
          <ChartCard
            title="توزيع Forecast الأسبوعي"
            subtitle="يشمل المدن الأربع الرئيسية ومدن أخرى إذا كانت النتيجة منطقية وغير سالبة."
          >
            <DistributionDonutChart data={distributionRows} />
            <p className="mt-3 text-sm leading-6 text-muted">
              موديل <span className="font-bold text-navy">كل المدن</span> تم تدريبه بشكل مستقل وقد لا يساوي تمامًا مجموع Forecast المدن الأربع.
            </p>
          </ChartCard>
        </div>

        <ChartCard title="أبرز الاستنتاجات" subtitle="هذه الملاحظات محسوبة من البيانات الحالية فقط.">
          <InsightList insights={insights} />
        </ChartCard>
      </div>
    </>
  );
}
