"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MAJOR_CITIES } from "@/lib/constants";

type ExecutiveFiltersProps = {
  startDate: string | null;
  endDate: string | null;
  selectedCities: string[];
  viewMode: "values" | "change";
  displayMode: "daily" | "weekly";
};

export function ExecutiveFilters(props: ExecutiveFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams]
  );

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const reset = () => {
    router.replace(pathname, { scroll: false });
  };

  const onCityToggle = (city: string) => {
    const current = new Set(props.selectedCities);
    if (current.has(city)) {
      current.delete(city);
    } else {
      current.add(city);
    }
    updateParam("cities", Array.from(current).join(","));
  };

  return (
    <div className="surface-card mb-5 grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-5">
      <div>
        <label className="mb-2 block text-sm font-bold text-navy">
          المدن
        </label>
        <div className="flex flex-wrap gap-2">
          {MAJOR_CITIES.map((city) => {
            const selected = props.selectedCities.includes(city);
            return (
              <button
                key={city}
                type="button"
                onClick={() => onCityToggle(city)}
                className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                  selected
                    ? "border-teal bg-teal/10 text-navy"
                    : "border-border bg-white text-muted"
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-navy">
          من تاريخ
        </label>
        <input
          type="date"
          value={props.startDate ?? ""}
          onChange={(event) => updateParam("start", event.target.value)}
          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-navy">
          إلى تاريخ
        </label>
        <input
          type="date"
          value={props.endDate ?? ""}
          onChange={(event) => updateParam("end", event.target.value)}
          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-navy">
          نمط العرض
        </label>
        <select
          value={props.viewMode}
          onChange={(event) => updateParam("view", event.target.value)}
          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy"
        >
          <option value="values">القيم الفعلية</option>
          <option value="change">نسبة التغير</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-navy">
          التلخيص
        </label>
        <div className="flex gap-2">
          <select
            value={props.displayMode}
            onChange={(event) => updateParam("display", event.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy"
          >
            <option value="daily">يومي</option>
            <option value="weekly">ملخص أسبوعي</option>
          </select>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold text-navy"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
