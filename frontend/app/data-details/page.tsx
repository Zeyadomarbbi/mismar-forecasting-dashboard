import { PageHeader } from "@/components/layout/page-header";
import { ChartCard } from "@/components/charts/chart-card";
import { DownloadButton } from "@/components/ui/download-button";
import { SimpleDataTable } from "@/components/tables/simple-data-table";
import { loadDashboardDatasets } from "@/lib/csv/load-datasets";
import { DATASET_FILES } from "@/lib/constants";

export default async function DataDetailsPage() {
  const datasets = await loadDashboardDatasets();
  const sections = [
    ["forecast", datasets.forecast],
    ["presentation", datasets.presentation],
    ["weeklySummary", datasets.weeklySummary],
    ["validation", datasets.validation],
    ["test", datasets.test],
    ["metrics", datasets.metrics],
    ["trainingSummary", datasets.trainingSummary],
  ] as const;

  return (
    <>
      <PageHeader
        title="تفاصيل البيانات"
        description="ملخص تقني لكل ملف CSV مع حالة التحميل، عدد الصفوف، التحذيرات، ومعاينة محدودة للبيانات."
      />

      <ChartCard title="Data quality summary">
        <SimpleDataTable
          columns={[
            "dataset",
            "fileName",
            "loaded",
            "rowCount",
            "columnCount",
            "missingValues",
            "duplicateRows",
            "invalidDates",
            "negativeForecasts",
          ]}
          rows={datasets.quality.map((row) => ({
            dataset: row.dataset,
            fileName: row.fileName,
            loaded: row.loaded ? "نعم" : "لا",
            rowCount: String(row.rowCount),
            columnCount: String(row.columnCount),
            missingValues: String(row.missingValues),
            duplicateRows: String(row.duplicateRows),
            invalidDates: String(row.invalidDates),
            negativeForecasts: String(row.negativeForecasts),
          }))}
        />
      </ChartCard>

      <div className="mt-5 grid gap-5">
        {sections.map(([key, rows]) => {
          const columns = rows[0] ? Object.keys(rows[0]) : [];
          const content = [
            columns.join(","),
            ...rows.slice(0, 200).map((row) =>
              columns.map((column) => String((row as Record<string, unknown>)[column] ?? "")).join(",")
            ),
          ].join("\n");
          return (
            <ChartCard
              key={key}
              title={key}
              subtitle={`الملف: ${DATASET_FILES[key]}`}
            >
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="rounded-xl border border-border bg-bg px-3 py-2 text-sm text-muted">
                  الصفوف: {rows.length}
                </div>
                <div className="rounded-xl border border-border bg-bg px-3 py-2 text-sm text-muted">
                  الأعمدة: {columns.length}
                </div>
                <DownloadButton
                  fileName={`${key}.csv`}
                  content={content}
                  label="تحميل CSV"
                />
              </div>
              <SimpleDataTable
                columns={columns}
                rows={rows.slice(0, 20).map((row) =>
                  Object.fromEntries(
                    columns.map((column) => [column, String((row as Record<string, unknown>)[column] ?? "غير متاح")])
                  )
                )}
              />
            </ChartCard>
          );
        })}
      </div>
    </>
  );
}
