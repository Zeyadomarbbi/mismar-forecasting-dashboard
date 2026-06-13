import { safeText } from "@/lib/formatting";

export function SimpleDataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Record<string, string | number | null>>;
}) {
  return (
    <div className="soft-scrollbar overflow-x-auto rounded-2xl border border-border">
      <table className="min-w-full border-collapse text-right text-sm">
        <thead className="sticky top-0 bg-bg">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="whitespace-nowrap border-b border-border px-4 py-3 font-extrabold text-navy"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border/70 last:border-b-0">
              {columns.map((column) => (
                <td key={column} className="whitespace-nowrap px-4 py-3 text-muted">
                  {safeText(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
