type HeaderMeta = {
  label: string;
  value: string;
};

export function PageHeader({
  title,
  description,
  meta,
}: {
  title: string;
  description: string;
  meta?: HeaderMeta[];
}) {
  return (
    <header className="surface-card mb-5 p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-extrabold text-navy md:text-[2rem]">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted md:text-base">
            {description}
          </p>
        </div>
        {meta && meta.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {meta.map((item) => (
              <div
                key={`${item.label}-${item.value}`}
                className="rounded-2xl border border-border bg-bg px-4 py-3"
              >
                <div className="text-xs font-semibold text-muted">
                  {item.label}
                </div>
                <div className="mt-1 text-sm font-bold text-navy numbers-ltr">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
