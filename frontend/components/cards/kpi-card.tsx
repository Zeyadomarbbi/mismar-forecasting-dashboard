import { LucideIcon } from "lucide-react";

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: string;
}) {
  return (
    <div
      className="surface-card h-full p-4"
      style={{ borderTopWidth: 4, borderTopColor: accent ?? "#10233F" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold text-muted">{title}</div>
          <div className="mt-3 break-words text-2xl font-extrabold text-navy md:text-[1.9rem] numbers-ltr">
            {value}
          </div>
          {subtitle ? (
            <div className="mt-2 text-sm leading-6 text-muted">{subtitle}</div>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-bg p-2 text-navy">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
