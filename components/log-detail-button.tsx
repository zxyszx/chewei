"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";

export function LogDetailButton({ title, detail }: { title: string; detail: string }) {
  const [open, setOpen] = useState(false);
  let formatted = detail;
  try { formatted = JSON.stringify(JSON.parse(detail), null, 2); } catch {}
  return <><button type="button" className="btn min-h-8 px-2 text-[12px]" onClick={() => setOpen(true)}><Eye size={14} />查看详情</button><FormDialog open={open} onClose={() => setOpen(false)} title={title} description="原始审计字段"><pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-[8px] bg-[var(--surface-subtle)] p-4 text-[12px] leading-6">{formatted || "无详细字段"}</pre></FormDialog></>;
}
