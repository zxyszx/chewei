"use client";

import { Download } from "lucide-react";

type CsvRow = Record<string, string | number>;

const escapeCell = (value: string | number) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function CsvExport({ filename, rows, labels, className = "btn" }: { filename: string; rows: CsvRow[]; labels: Record<string, string>; className?: string }) {
  const download = () => {
    const keys = Object.keys(labels);
    const lines = [keys.map((key) => escapeCell(labels[key])).join(","), ...rows.map((row) => keys.map((key) => escapeCell(row[key] ?? "")).join(","))];
    const blob = new Blob(["\ufeff", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return <button type="button" className={className} onClick={download} disabled={!rows.length}><Download size={16} /><span>导出</span></button>;
}
