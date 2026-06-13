export function ChartCard({
  title,
  subtitle,
  children,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  emptyMessage?: string;
}) {
  return (
    <section className="chart-card">
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-navy md:text-lg">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 text-sm leading-6 text-muted">{subtitle}</p>
        ) : null}
      </div>
      {children ? (
        children
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-bg px-4 py-10 text-center text-sm text-muted">
          {emptyMessage ?? "لا توجد بيانات متاحة لهذا الرسم."}
        </div>
      )}
    </section>
  );
}
