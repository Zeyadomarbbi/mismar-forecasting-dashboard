export function InsightList({ insights }: { insights: string[] }) {
  if (!insights.length) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {insights.map((insight) => (
        <div
          key={insight}
          className="surface-card border-r-4 border-r-teal p-4 text-sm leading-7 text-navy"
        >
          {insight}
        </div>
      ))}
    </div>
  );
}
