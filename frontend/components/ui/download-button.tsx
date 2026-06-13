"use client";

import { Download } from "lucide-react";
import { toCsvBom } from "@/lib/formatting";

export function DownloadButton({
  fileName,
  content,
  label,
}: {
  fileName: string;
  content: string;
  label: string;
}) {
  const handleDownload = () => {
    const blob = new Blob([toCsvBom(content)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-navy transition hover:bg-bg"
    >
      <Download className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
