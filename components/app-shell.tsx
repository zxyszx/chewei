"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell, ChartNoAxesCombined, ChevronDown, CreditCard,
  History, House, LoaderCircle, LogOut, Menu, PanelLeftClose, PanelLeftOpen,
  ParkingCircle, Plus, Search, Settings, SlidersHorizontal, UsersRound, X,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { InstallAppButton } from "@/components/install-app-button";
import { ThemePicker, ThemeToggle } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

type SearchItem = { id: string; type: "共享账号" | "车友"; title: string; subtitle: string; href: string };

const navigation = [
  { label: "业务", items: [["/", "总览", House], ["/slots", "共享账号", ParkingCircle], ["/members", "车友", UsersRound], ["/renewals", "续费", CreditCard], ["/reminders", "提醒", Bell]] },
  { label: "分析", items: [["/analytics", "数据统计", ChartNoAxesCombined]] },
  { label: "系统", items: [["/logs", "操作日志", History], ["/settings", "系统设置", Settings]] },
] as const;

function NavPending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className="grid size-4 shrink-0 place-items-center">{pending && <LoaderCircle size={13} className="nav-pending animate-spin" />}</span>;
}

function NavLink({ href, label, icon: Icon, leading, badge, compact = false, onClick }: { href: string; label: string; icon?: typeof House; leading?: React.ReactNode; badge?: number; compact?: boolean; onClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [targetPath, query] = href.split("?");
  const active = href === "/" ? pathname === href : query ? pathname === targetPath && [...new URLSearchParams(query)].every(([key, value]) => searchParams.get(key) === value) : targetPath === "/slots" ? pathname === targetPath && !searchParams.get("platform") : pathname.startsWith(targetPath);
  return <Link href={href} onClick={onClick} title={compact ? label : undefined} aria-label={compact ? label : undefined} className={cn("nav-link", compact && "justify-center px-0", active && "nav-link-active")}>{leading || (Icon && <Icon size={16} strokeWidth={1.8} />)}{!compact && <><span className="min-w-0 flex-1 truncate">{label}</span>{badge !== undefined && <span className="nav-badge">{badge}</span>}<NavPending /></>}</Link>;
}

function Sidebar({ reminderCount, compact = false, close, toggleCompact }: { reminderCount: number; compact?: boolean; close?: () => void; toggleCompact?: () => void }) {
  return <aside className={cn("sidebar flex h-full shrink-0 flex-col border-r border-[var(--border)] transition-[width] duration-200", compact ? "w-[68px]" : "w-[220px]")}>
    <div className={cn("flex h-[58px] items-center gap-2 border-b border-[var(--border)]", compact ? "justify-center px-2" : "px-4")}><div className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-white"><ParkingCircle size={19} /></div>{!compact && <strong className="min-w-0 flex-1 truncate text-[15px]">车位管理系统</strong>}{toggleCompact && <button onClick={toggleCompact} className="grid size-8 shrink-0 place-items-center rounded-[6px] text-[#777] hover:bg-[#f2f2f2] hover:text-[#171717]" aria-label={compact ? "展开侧栏" : "收起侧栏"} title={compact ? "展开侧栏" : "收起侧栏"}>{compact ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button>}{close && <button autoFocus onClick={close} className="btn icon-btn ml-auto" aria-label="关闭菜单"><X size={16} /></button>}</div>
    <nav className="flex-1 overflow-y-auto px-2.5 py-3" aria-label="主导航">
      {navigation.map((group, groupIndex) => <div key={group.label} className={groupIndex ? "mt-4" : ""}>
        {!compact && <p className="nav-group-label">{group.label}</p>}
        {compact && groupIndex > 0 && <div className="mx-auto my-3 h-px w-6 bg-[var(--border)]" />}
        <div className="space-y-0.5">{group.items.map(([href, label, Icon]) => <NavLink key={href} href={href} label={label} icon={Icon} badge={href === "/reminders" ? reminderCount : undefined} compact={compact} onClick={close} />)}</div>
      </div>)}
    </nav>
  </aside>;
}

function AccountMenu({ username, role }: { username: string; role: string }) {
  return <details className="account-menu relative">
    <summary className="account-trigger" aria-label="打开账号菜单"><span className="account-avatar">{username.slice(0, 1).toUpperCase()}</span><span className="desktop-only min-w-0 text-left"><strong className="block max-w-[110px] truncate text-[12px] font-semibold">{username}</strong><span className="block text-[10px] text-[var(--muted-foreground)]">{role === "ADMIN" ? "管理员" : "操作员"}</span></span><ChevronDown size={14} className="desktop-only text-[var(--muted-foreground)]" /></summary>
    <div className="menu-popover absolute right-0 top-[calc(100%+8px)] z-50 w-[250px] rounded-[7px] border border-[var(--border)] p-1.5 shadow-xl">
      <div className="border-b border-[var(--border)] px-2.5 pb-2.5 pt-1.5"><p className="truncate text-[13px] font-semibold">{username}</p><p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{role === "ADMIN" ? "系统管理员" : "运营账号"}</p></div>
      <div className="py-1.5"><Link href="/settings" className="menu-item"><Settings size={15} /><span>系统设置</span></Link><InstallAppButton showLabel /></div>
      <div className="border-y border-[var(--border)] py-1.5"><p className="px-2.5 pb-1.5 text-[10px] font-semibold text-[var(--muted-foreground)]">外观</p><ThemePicker /></div>
      <form action={logoutAction} className="pt-1.5"><button className="menu-item menu-item-danger w-full"><LogOut size={15} /><span>退出登录</span></button></form>
    </div>
  </details>;
}

const shortcuts = [
  { label: "新增共享账号", detail: "录入登录账号并设置成员席位", href: "/slots?create=1", icon: Plus },
  { label: "车友管理", detail: "查找、续费和更换账号席位", href: "/members", icon: UsersRound },
  { label: "到期提醒", detail: "处理即将到期与已过期", href: "/reminders", icon: Bell },
  { label: "系统设置", detail: "平台、容量与安全设置", href: "/settings", icon: SlidersHorizontal },
] as const;

function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const closePalette = () => { setQuery(""); setItems([]); setLoading(false); setActiveIndex(0); onClose(); };
  useEffect(() => {
    if (!open) return;
    const normalized = query.trim();
    if (!normalized) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`, { signal: controller.signal });
        setItems(response.ok ? (await response.json()).items : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query]);
  const choices = query.trim() ? items : shortcuts;
  const selectedIndex = Math.min(activeIndex, Math.max(choices.length - 1, 0));
  const selectChoice = (index: number) => {
    const choice = choices[index];
    if (!choice) return;
    router.push(choice.href);
    closePalette();
  };
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] bg-black/35 px-3 pt-[9vh]" onMouseDown={closePalette} role="presentation"><div role="dialog" aria-modal="true" aria-label="全局搜索" className="mx-auto w-full max-w-[620px] overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4"><Search size={18} className="text-[#768092]" /><input autoFocus aria-label="全局搜索" aria-controls="global-search-results" aria-activedescendant={choices[selectedIndex] ? `global-search-option-${selectedIndex}` : undefined} value={query} onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(Math.min(selectedIndex + 1, choices.length - 1)); } else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(Math.max(selectedIndex - 1, 0)); } else if (event.key === "Enter") { event.preventDefault(); selectChoice(selectedIndex); } else if (event.key === "Escape") closePalette(); }} className="command-input h-14 min-w-0 flex-1 bg-transparent outline-none" placeholder="搜索共享账号、车友或联系方式" />{loading && <LoaderCircle size={16} className="animate-spin text-[var(--accent)]" />}<button onClick={closePalette} className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[#697386]" aria-label="关闭全局搜索">ESC</button></div>
    <div id="global-search-results" role="listbox" className="max-h-[440px] overflow-y-auto p-2">{query.trim() ? items.length ? items.map((item, index) => <button id={`global-search-option-${index}`} role="option" aria-selected={activeIndex === index} key={`${item.type}-${item.id}`} className={cn("flex min-h-[54px] w-full items-center gap-3 rounded-[6px] px-3 text-left", activeIndex === index ? "bg-[var(--surface-subtle)]" : "hover:bg-[var(--surface-subtle)]")} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectChoice(index)}><span className="badge badge-neutral">{item.type}</span><span className="min-w-0"><strong className="block truncate text-[13px] font-semibold">{item.title}</strong><span className="block truncate text-[12px] text-[var(--muted-foreground)]">{item.subtitle}</span></span></button>) : !loading && <div className="empty">没有找到匹配结果</div> : <><p className="px-3 pb-1 pt-2 text-[11px] font-semibold text-[#929baa]">快捷操作</p>{shortcuts.map(({ label, detail, href, icon: Icon }, index) => <button id={`global-search-option-${index}`} role="option" aria-selected={activeIndex === index} key={href} className={cn("flex min-h-[54px] w-full items-center gap-3 rounded-[6px] px-3 text-left", activeIndex === index ? "bg-[var(--surface-subtle)]" : "hover:bg-[var(--surface-subtle)]")} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectChoice(index)}><span className="grid size-8 place-items-center rounded-[6px] bg-[var(--surface-subtle)] text-[var(--muted-foreground)]"><Icon size={16} /></span><span className="min-w-0"><strong className="block truncate text-[13px] font-semibold">{label}</strong><span className="block truncate text-[12px] text-[var(--muted-foreground)]">{detail}</span></span></button>)}</>}</div>
  </div></div>;
}

export function AppShell({ children, reminderCount, username, role }: { children: React.ReactNode; reminderCount: number; username: string; role: string }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSidebarCompact(window.localStorage.getItem("parking-sidebar") === "compact"));
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") { setSearchOpen(false); setMobileNav(false); }
    };
    window.addEventListener("keydown", handler); return () => { window.cancelAnimationFrame(frame); window.removeEventListener("keydown", handler); };
  }, []);
  const toggleSidebar = () => setSidebarCompact((current) => {
    window.localStorage.setItem("parking-sidebar", current ? "expanded" : "compact");
    return !current;
  });
  return <div className="flex min-h-dvh" style={{ "--sidebar-width": sidebarCompact ? "68px" : "220px" } as React.CSSProperties}>
    <a href="#main-content" className="skip-link">跳到主要内容</a>
    <div className="fixed inset-y-0 left-0 z-40 desktop-only"><Sidebar reminderCount={reminderCount} compact={sidebarCompact} toggleCompact={toggleSidebar} /></div>
    {mobileNav && <div className="fixed inset-0 z-[90] bg-black/35" onClick={() => setMobileNav(false)}><div role="dialog" aria-modal="true" aria-label="移动导航" className="h-full w-[220px]" onClick={(e) => e.stopPropagation()}><Sidebar reminderCount={reminderCount} close={() => setMobileNav(false)} /></div></div>}
    <div className="min-w-0 flex-1 pl-[var(--sidebar-width)]">
      <header className="app-header fixed left-[var(--sidebar-width)] right-0 top-0 z-30 flex h-[58px] items-center border-b border-[var(--border)] px-4 backdrop-blur-sm md:px-5">
        <button className="btn icon-btn mobile-only mr-2" onClick={() => setMobileNav(true)} aria-label="打开菜单"><Menu size={18} /></button>
        <button onClick={() => setSearchOpen(true)} className="mx-auto flex h-9 w-full max-w-[430px] items-center gap-2 rounded-[6px] border border-[var(--border)] bg-[#fafbfc] px-3 text-left text-[13px] text-[#727c8d] hover:border-[#cbd2dc]"><Search size={15} /><span className="min-w-0 flex-1 truncate">搜索共享账号、车友...</span><kbd className="desktop-only rounded border border-[#e2e6eb] bg-white px-1.5 py-0.5 text-[10px]">⌘ K</kbd></button>
        <div className="ml-3 flex items-center gap-1"><ThemeToggle className="desktop-only" /><Link href="/reminders" className="btn icon-btn relative" aria-label={`到期提醒，${reminderCount} 条`} title="到期提醒"><Bell size={17} />{reminderCount > 0 && <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-[#d33d3d] px-1 text-[9px] leading-4 text-white">{Math.min(reminderCount, 99)}</span>}</Link><div className="ml-1 border-l border-[var(--border)] pl-2"><AccountMenu username={username} role={role} /></div></div>
      </header>
      <main id="main-content" className="min-h-dvh px-3 pb-8 pt-[78px] md:px-5 xl:px-6">{children}</main>
    </div>
    <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
  </div>;
}
