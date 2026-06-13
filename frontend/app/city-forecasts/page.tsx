import { ChartCard } from "@/components/charts/chart-card";
import { SingleCityAreaChart } from "@/components/charts/dashboard-charts";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/cards/kpi-card";
import { SimpleDataTable } from "@/components/tables/simple-data-table";
import { loadDashboardDatasets } from "@/lib/csv/load-datasets";
import {
  getForecastDateRange,
  summarizeSeries,
} from "@/lib/analytics";
import { MAJOR_CITIES, SERIES_COLORS } from "@/lib/constants";
import { formatDateLabel, formatNumber, formatPercent } from "@/lib/formatting";

export default async function CityForecastsPage({
  searchParams,
}: {
  searchParams?: Promise<{ city?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const selectedCity = MAJOR_CITIES.includes(params.city as (typeof MAJOR_CITIES)[number])
    ? (params.city as (typeof MAJOR_CITIES)[number])
    : MAJOR_CITIES[0];
  const datasets = await loadDashboardDatasets();
  const citySummary = summarizeSeries(datasets.forecast, selectedCity);
  const range = getForecastDateRange(citySummary.rows);

  const forecastTableRows = citySummary.rows.map((row, index, list) => {
    const previous = index === 0 ? null : list[index - 1].forecastOrders ?? 0;
    const change =
      previous === null ? null : (row.forecastOrders ?? 0) - previous;
    const changePct =
      previous === null || previous === 0
        ? null
        : (((row.forecastOrders ?? 0) - previous) / previous) * 100;
    return {
      "التاريخ": row.date,
      "اسم اليوم": row.dayNameAr,
      "الطلبات المتوقعة": formatNumber(row.forecastOrders, 0),
      "التغير عن اليوم السابق": formatNumber(change, 0),
      "نسبة التغير": formatPercent(changePct),
      "ترتيب الأسبوع": String(index + 1),
    };
  });

  return (
    <>
      <PageHeader
        title="توقعات المدن الرئيسية"
        description="صفحة تفصيلية للمدينة المختارة خلال الأسبوع القادم فقط، مع التركيز على Forecast اليومي والملخص الأسبوعي."
        meta={[
          { label: "المدينة", value: selectedCity },
          {
            label: "فترة التوقع",
            value: `${formatDateLabel(range.start)} إلى ${formatDateLabel(range.end)}`,
          },
        ]}
      />

      <div className="surface-card mb-5 p-4">
        <div className="flex flex-wrap gap-2">
          {MAJOR_CITIES.map((city) => (
            <a
              key={city}
              href={`/city-forecasts?city=${encodeURIComponent(city)}`}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                city === selectedCity
                  ? "border-transparent text-white"
                  : "border-border bg-white text-muted"
              }`}
              style={{
                backgroundColor:
                  city === selectedCity ? SERIES_COLORS[city] : undefined,
              }}
            >
              {city}
            </a>
          ))}
        </div>
      </div>

      <section className="section-grid md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="إجمالي Forecast الأسبوع"
          value={formatNumber(citySummary.weeklyTotal, 0)}
          subtitle="للمدينة المختارة"
          accent={SERIES_COLORS[selectedCity]}
        />
        <KpiCard
          title="المتوسط اليومي"
          value={formatNumber(citySummary.dailyAverage, 2)}
          subtitle="متوسط Forecast اليومي"
          accent={SERIES_COLORS[selectedCity]}
        />
        <KpiCard
          title="أعلى يوم متوقع"
          value={formatDateLabel(citySummary.peak?.date)}
          subtitle={formatNumber(citySummary.peak?.forecastOrders ?? null, 0)}
          accent={SERIES_COLORS[selectedCity]}
        />
        <KpiCard
          title="أقل يوم متوقع"
          value={formatDateLabel(citySummary.low?.date)}
          subtitle={formatNumber(citySummary.low?.forecastOrders ?? null, 0)}
          accent={SERIES_COLORS[selectedCity]}
        />
      </section>

      <div className="mt-5 grid gap-5">
        <ChartCard
          title={`Forecast يومي - ${selectedCity}`}
          subtitle="الرسم الرئيسي للسبعة أيام المقبلة."
        >
          <SingleCityAreaChart
            data={citySummary.rows}
            color={SERIES_COLORS[selectedCity]}
          />
        </ChartCard>

        <ChartCard
          title="جدول Forecast اليومي"
          subtitle="يشمل التاريخ، اسم اليوم، التغيرات اليومية، وترتيب الأسبوع."
        >
          <SimpleDataTable
            columns={Object.keys(forecastTableRows[0] ?? {})}
            rows={forecastTableRows}
          />
        </ChartCard>
      </div>
    </>
  );
}
