"use client";

import { BarChart3, BellRing, CircleParking, History, LayoutDashboard, LoaderCircle, ReceiptText, Search, Settings, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SearchItem = { id: string; type: "合租车位" | "车友"; title: string; subtitle: string; href: string };

const quickLinks = [
  ["/", "总览", LayoutDashboard], ["/slots", "合租车位", CircleParking],
  ["/members", "车友", UserRound], ["/renewals", "续费", ReceiptText],
  ["/reminders", "提醒", BellRing], ["/analytics", "数据统计", BarChart3],
  ["/logs", "操作日志", History], ["/settings", "系统设置", Settings],
] as const;

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const open = () => { dialog.current?.showModal(); window.setTimeout(() => input.current?.focus(), 20); };
  const close = () => { dialog.current?.close(); setQuery(""); setItems([]); setLoading(false); };

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); open(); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const data = await response.json() as { items?: SearchItem[] };
        setItems(data.items || []);
      } catch { if (!controller.signal.aborted) setItems([]); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  return <>
    <button type="button" className={cn("workspace-search-trigger", compact && "workspace-search-compact")} onClick={open} aria-label="全局搜索" title="全局搜索">
      <Search size={16} />{!compact && <><span>搜索账号或成员</span><kbd>⌘ K</kbd></>}
    </button>
    <dialog ref={dialog} className="search-dialog m-auto w-[calc(100%-24px)] max-w-[620px] overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-black/45" onCancel={(event) => { event.preventDefault(); close(); }} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="flex h-14 items-center gap-3 border-b border-[var(--border)] px-4">
        {loading ? <LoaderCircle size={18} className="animate-spin text-[var(--accent)]" /> : <Search size={18} className="text-[var(--muted-foreground)]" />}
        <input ref={input} value={query} onChange={(event) => { const value = event.target.value; setQuery(value); if (value.trim().length < 2) { setItems([]); setLoading(false); } }} className="command-input h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none" placeholder="输入账号、平台、成员或联系方式" aria-label="搜索账号、平台或成员" />
        <button type="button" className="icon-button" onClick={close} aria-label="关闭搜索"><X size={17} /></button>
      </div>
      <div className="min-h-[150px] max-h-[420px] overflow-y-auto p-2">
        {query.trim().length < 2 && <div className="p-2"><p className="mb-2 px-2 text-[10px] font-semibold text-[var(--muted-foreground)]">快速前往</p><div className="grid grid-cols-2 gap-1 sm:grid-cols-4">{quickLinks.map(([href, label, Icon]) => <Link key={href} href={href} onClick={close} className="search-quick-link"><Icon size={16} /><span>{label}</span></Link>)}</div><p className="mt-4 px-2 text-center text-[11px] text-[var(--muted-foreground)]">输入至少两个字符可搜索账号、平台与车友</p></div>}
        {query.trim().length >= 2 && !loading && items.length === 0 && <div className="search-empty"><p>没有找到相关账号或成员</p></div>}
        {items.map((item) => <Link key={`${item.type}-${item.id}`} href={item.href} onClick={close} className="search-result">
          <span className="search-result-icon">{item.type === "合租车位" ? <CircleParking size={17} /> : <UserRound size={17} />}</span>
          <span className="min-w-0 flex-1"><strong className="block truncate text-[13px]">{item.title}</strong><span className="mt-0.5 block truncate text-[11px] text-[var(--muted-foreground)]">{item.subtitle}</span></span>
          <span className="badge badge-neutral">{item.type}</span>
        </Link>)}
      </div>
    </dialog>
  </>;
}
