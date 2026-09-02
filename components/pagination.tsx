import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function Pagination({ page, total, pageSize, pathname, params }: { page: number; total: number; pageSize: number; pathname: string; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (target: number) => { const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value) query.set(key, value); }); query.set("page", String(target)); return `${pathname}?${query}`; };
  return <nav className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3" aria-label="分页"><span className="text-[12px] tabular text-[var(--muted-foreground)]">第 {page} / {pages} 页 · 共 {total} 条</span><div className="flex gap-2">{page > 1 ? <Link className="btn icon-btn min-h-9 size-9" href={href(page - 1)} aria-label="上一页" title="上一页"><ChevronLeft size={16} /></Link> : <button className="btn icon-btn min-h-9 size-9" disabled aria-label="已是第一页"><ChevronLeft size={16} /></button>}{page < pages ? <Link className="btn icon-btn min-h-9 size-9" href={href(page + 1)} aria-label="下一页" title="下一页"><ChevronRight size={16} /></Link> : <button className="btn icon-btn min-h-9 size-9" disabled aria-label="已是最后一页"><ChevronRight size={16} /></button>}</div></nav>;
}
