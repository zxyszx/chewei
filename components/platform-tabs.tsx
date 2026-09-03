"use client";

import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, ListFilter } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlatformIcon } from "@/components/platform-icon";

type PlatformTab = { id: string; name: string; slug: string; icon: string | null; count: number };
type SortMode = "custom" | "az";

const storageOrder = "chewei-platform-order-v1";
const storageMode = "chewei-platform-sort-v1";
const visibleCount = 6;

export function PlatformTabs({ platforms, current }: { platforms: PlatformTab[]; current?: string }) {
  const [mode, setMode] = useState<SortMode>("custom");
  const [order, setOrder] = useState<string[]>(platforms.map((platform) => platform.slug));
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const savedMode = localStorage.getItem(storageMode);
      let savedOrder: string[] = [];
      try {
        const parsed = JSON.parse(localStorage.getItem(storageOrder) || "[]") as unknown;
        if (Array.isArray(parsed)) savedOrder = parsed.filter((item): item is string => typeof item === "string");
      } catch {
        localStorage.removeItem(storageOrder);
      }
      setMode(savedMode === "az" ? "az" : "custom");
      setOrder([...savedOrder.filter((slug) => platforms.some((item) => item.slug === slug)), ...platforms.map((item) => item.slug).filter((slug) => !savedOrder.includes(slug))]);
    });
    return () => cancelAnimationFrame(frame);
  }, [platforms]);

  const sorted = useMemo(() => {
    if (mode === "az") return [...platforms].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
    const positions = new Map(order.map((slug, index) => [slug, index]));
    return [...platforms].sort((a, b) => (positions.get(a.slug) ?? 999) - (positions.get(b.slug) ?? 999));
  }, [mode, order, platforms]);

  const hiddenCurrent = current && sorted.findIndex((item) => item.slug === current) >= visibleCount;
  const shown = expanded ? sorted : hiddenCurrent ? [...sorted.slice(0, visibleCount - 1), sorted.find((item) => item.slug === current)!] : sorted.slice(0, visibleCount);
  const remaining = Math.max(0, sorted.length - visibleCount);

  const selectMode = (value: SortMode) => {
    setMode(value);
    localStorage.setItem(storageMode, value);
  };
  const move = (slug: string, direction: -1 | 1) => {
    setMode("custom");
    localStorage.setItem(storageMode, "custom");
    setOrder((currentOrder) => {
      const next = [...currentOrder];
      const index = next.indexOf(slug);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= next.length) return currentOrder;
      [next[index], next[target]] = [next[target], next[index]];
      localStorage.setItem(storageOrder, JSON.stringify(next));
      return next;
    });
  };

  return <nav className="platform-tabs" aria-label="合租车位工作表">
    <div className="platform-tabs-scroll">
      <Link href="/slots" scroll={false} aria-current={!current ? "page" : undefined} className={!current ? "platform-tab platform-tab-active" : "platform-tab"}>全部车位<span>{platforms.reduce((sum, item) => sum + item.count, 0)}</span></Link>
      {shown.map((platform) => <Link key={platform.id} href={`/slots?platform=${encodeURIComponent(platform.slug)}`} scroll={false} aria-current={current === platform.slug ? "page" : undefined} className={current === platform.slug ? "platform-tab platform-tab-active" : "platform-tab"}><PlatformIcon slug={platform.slug} name={platform.name} icon={platform.icon} size={16} />{platform.name}<span>{platform.count}</span></Link>)}
    </div>
    {remaining > 0 && <button type="button" className="platform-tab platform-tab-more" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}{expanded ? "收起" : `剩余 ${remaining} 个`}</button>}
    <details name="chewei-popover" className="platform-sort-menu relative ml-auto">
      <summary className="platform-tab platform-sort-trigger" aria-label="设置平台排序"><ListFilter size={16} />排序</summary>
      <div className="platform-sort-popover">
        <div className="platform-sort-modes"><button type="button" onClick={() => selectMode("custom")} className={mode === "custom" ? "active" : ""}>自定义{mode === "custom" && <Check size={13} />}</button><button type="button" onClick={() => selectMode("az")} className={mode === "az" ? "active" : ""}>A-Z{mode === "az" && <Check size={13} />}</button></div>
        {mode === "custom" && <div className="platform-sort-list">{sorted.map((platform, index) => <div key={platform.id}><PlatformIcon slug={platform.slug} name={platform.name} icon={platform.icon} size={14} /><span>{platform.name}</span><button type="button" onClick={() => move(platform.slug, -1)} disabled={index === 0} aria-label={`${platform.name} 上移`} title="上移"><ArrowUp size={14} /></button><button type="button" onClick={() => move(platform.slug, 1)} disabled={index === sorted.length - 1} aria-label={`${platform.name} 下移`} title="下移"><ArrowDown size={14} /></button></div>)}</div>}
      </div>
    </details>
  </nav>;
}
