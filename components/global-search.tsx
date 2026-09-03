"use client";

import { CircleParking, LoaderCircle, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SearchItem = { id: string; type: "合租车位" | "车友"; title: string; subtitle: string; href: string };

export function GlobalSearch() {
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
      }
      if (event.key === "Escape") input.current?.blur();
    };
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setFocused(false);
    };
    window.addEventListener("keydown", shortcut);
    window.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", shortcut);
      window.removeEventListener("pointerdown", outside);
    };
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        const data = await response.json() as { items?: SearchItem[] };
        setItems(data.items || []);
      } catch {
        if (!controller.signal.aborted) setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const open = focused && query.trim().length >= 2;
  const clear = () => {
    setQuery("");
    setItems([]);
    input.current?.focus();
  };
  const updateQuery = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setItems([]);
      setLoading(false);
    }
  };

  return <div ref={root} className="workspace-search">
    <Search size={17} className="workspace-search-icon" aria-hidden="true" />
    <input ref={input} type="search" value={query} onFocus={() => setFocused(true)} onChange={(event) => updateQuery(event.target.value)} className="workspace-search-input" placeholder="搜索账号、平台、成员或联系方式" aria-label="全局搜索" />
    {loading ? <LoaderCircle size={16} className="workspace-search-end animate-spin" /> : query ? <button type="button" className="workspace-search-clear" onClick={clear} aria-label="清空搜索"><X size={15} /></button> : <kbd className="workspace-search-shortcut">⌘ K</kbd>}
    {open && <div id="workspace-search-results" className="workspace-search-results" role="listbox">
      {!loading && items.length === 0 && <div className="search-empty">没有找到相关账号或成员</div>}
      {items.map((item) => <Link key={`${item.type}-${item.id}`} href={item.href} onClick={() => { setFocused(false); setQuery(""); }} className="search-result" role="option">
        <span className="search-result-icon">{item.type === "合租车位" ? <CircleParking size={17} /> : <UserRound size={17} />}</span>
        <span className="min-w-0 flex-1"><strong className="block truncate text-[13px]">{item.title}</strong><span className="mt-0.5 block truncate text-[11px] text-[var(--muted-foreground)]">{item.subtitle}</span></span>
        <span className="badge badge-neutral">{item.type}</span>
      </Link>)}
    </div>}
  </div>;
}
