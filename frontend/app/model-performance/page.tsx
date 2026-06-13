import { ChartCard } from "@/components/charts/chart-card";
import {
  MetricsBarChart,
  MetricsScatterChart,
} from "@/components/charts/dashboard-charts";
import { KpiCard } from "@/components/cards/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { SimpleDataTable } from "@/components/tables/simple-data-table";
import { loadDashboardDatasets } from "@/lib/csv/load-datasets";
import { getBestMetricRows, withMetricImprovements } from "@/lib/analytics";
import { formatNumber, formatPercent } from "@/lib/formatting";

export default async function ModelPerformancePage() {
  const datasets = await loadDashboardDatasets();
  const metrics = withMetricImprovements(datasets.metrics);
  const summary = getBestMetricRows(datasets.metrics);

  return (
    <>
      <PageHeader
        title="أداء الموديلات"
        description="تحليل دقة الموديلات باستخدام ملف Model Metrics الحقيقي مع مقارنة مباشرة ضد Seasonal Naive Baseline."
      />

      <section className="section-grid md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="أفضل Test WAPE"
          value={summary.bestWape?.series ?? "غير متاح"}
          subtitle={formatPercent(summary.bestWape?.testWape ?? null)}
        />
        <KpiCard
          title="أفضل MAE"
          value={summary.bestMae?.series ?? "غير متاح"}
          subtitle={formatNumber(summary.bestMae?.testMae ?? null, 2)}
        />
        <KpiCard
          title="أكبر تحسن عن Baseline"
          value={summary.bestImprovement?.series ?? "غير متاح"}
          subtitle={formatPercent((summary.bestImprovement as { improvementPct?: number | null } | null)?.improvementPct ?? null)}
        />
        <KpiCard title="أفضل من Baseline" value={formatNumber(summary.betterThanBaselineCount, 0)} />
        <KpiCard title="بحاجة لتحسين" value={formatNumber(summary.needImprovementCount, 0)} />
      </section>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard title="Test WAPE حسب السلسلة">
            <MetricsBarChart data={metrics} metricKey="testWape" />
          </ChartCard>
          <ChartCard title="Test WAPE مقابل Baseline WAPE">
            <MetricsBarChart data={metrics} metricKey="testWape" baselineKey="baselineWape" />
          </ChartCard>
          <ChartCard title="MAE حسب السلسلة">
            <MetricsBarChart data={metrics} metricKey="testMae" />
          </ChartCard>
          <ChartCard title="RMSE حسب السلسلة">
            <MetricsBarChart data={metrics} metricKey="testRmse" />
          </ChartCard>
          <ChartCard title="Bias حسب السلسلة">
            <MetricsBarChart data={metrics} metricKey="testBias" />
          </ChartCard>
          <ChartCard title="Historical Volume vs WAPE">
            <MetricsScatterChart data={metrics} />
          </ChartCard>
        </div>

        <ChartCard
          title="جدول ترتيب الموديلات"
          subtitle="تصنيف WAPE إرشادي: أقل من 10 ممتاز، 10-20 جيد، 20-30 مقبول بحذر، 30+ يحتاج تحسين."
        >
          <SimpleDataTable
            columns={[
              "السلسلة",
              "Test MAE",
              "Test RMSE",
              "Test WAPE",
              "Baseline WAPE",
              "Absolute Improvement",
              "Improvement %",
              "Bias",
              "أفضل من Baseline",
              "Best Epoch",
              "Historical Order Total",
              "Historical Daily Average",
            ]}
            rows={metrics.map((row) => ({
              "السلسلة": row.series,
              "Test MAE": formatNumber(row.testMae ?? null, 2),
              "Test RMSE": formatNumber(row.testRmse ?? null, 2),
              "Test WAPE": formatPercent(row.testWape ?? null),
              "Baseline WAPE": formatPercent(row.baselineWape ?? null),
              "Absolute Improvement": formatPercent((row as { improvement?: number | null }).improvement ?? null),
              "Improvement %": formatPercent((row as { improvementPct?: number | null }).improvementPct ?? null),
              "Bias": formatPercent(row.testBias ?? null),
              "أفضل من Baseline": row.betterThanBaseline ?? "غير متاح",
              "Best Epoch": formatNumber(row.bestEpoch ?? null, 0),
              "Historical Order Total": formatNumber(row.historicalTotalOrders ?? null, 0),
              "Historical Daily Average": formatNumber(row.historicalDailyAverage ?? null, 2),
            }))}
          />
        </ChartCard>
      </div>
    </>
  );
}
