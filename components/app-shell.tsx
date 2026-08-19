"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell, ChartNoAxesCombined, ChevronDown, CircleUserRound, CreditCard, Gauge,
  History, House, KeyRound, LogOut, Menu, ParkingCircle, Search, Settings, UsersRound, X,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { cn } from "@/lib/utils";

type PlatformItem = { id: string; name: string; slug: string; count: number };
type SearchItem = { id: string; type: "车位" | "车友" | "账号"; title: string; subtitle: string; href: string };

const primary = [
  ["/", "总览", House], ["/slots", "车位管理", ParkingCircle], ["/members", "车友管理", UsersRound],
  ["/renewals", "续费记录", CreditCard], ["/reminders", "到期提醒", Bell], ["/accounts", "账号管理", KeyRound],
] as const;
const system = [["/analytics", "数据统计", ChartNoAxesCombined], ["/logs", "操作日志", History], ["/settings", "系统设置", Settings]] as const;

function NavLink({ href, label, icon: Icon, badge, onClick }: { href: string; label: string; icon: typeof House; badge?: number; onClick?: () => void }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === href : pathname.startsWith(href);
  return <Link href={href} onClick={onClick} className={cn("flex min-h-9 items-center gap-2.5 rounded-[5px] px-2.5 text-[13px] font-medium text-[#4d5767] transition-colors hover:bg-[#f2f4f7] hover:text-[#222936]", active && "bg-[#edf3ff] text-[#2457bd]")}><Icon size={16} strokeWidth={1.8} /><span className="min-w-0 flex-1 truncate">{label}</span>{badge !== undefined && <span className="rounded-full border border-[#e2e7ee] bg-white px-1.5 text-[11px] tabular-nums text-[#667085]">{badge}</span>}</Link>;
}

function Sidebar({ platforms, reminderCount, close }: { platforms: PlatformItem[]; reminderCount: number; close?: () => void }) {
  return <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-[var(--border)] bg-white">
    <div className="flex h-[58px] items-center gap-2.5 border-b border-[var(--border)] px-4"><div className="grid size-8 place-items-center rounded-[7px] bg-[#edf3ff] text-[#2563eb]"><ParkingCircle size={20} /></div><strong className="text-[15px]">车位管理系统</strong>{close && <button onClick={close} className="btn icon-btn ml-auto" aria-label="关闭菜单"><X size={16} /></button>}</div>
    <nav className="flex-1 overflow-y-auto px-2.5 py-3" aria-label="主导航">
      <div className="space-y-0.5">{primary.map(([href, label, Icon]) => <NavLink key={href} href={href} label={label} icon={Icon} badge={href === "/reminders" ? reminderCount : undefined} onClick={close} />)}</div>
      <p className="mb-1.5 mt-5 px-2.5 text-[11px] font-semibold text-[#929baa]">平台</p>
      <div className="space-y-0.5">{platforms.map((platform) => <NavLink key={platform.id} href={`/slots?platform=${platform.slug}`} label={platform.name} icon={Gauge} badge={platform.count} onClick={close} />)}<NavLink href="/slots" label="全平台" icon={Gauge} badge={platforms.reduce((sum, item) => sum + item.count, 0)} onClick={close} /></div>
      <p className="mb-1.5 mt-5 px-2.5 text-[11px] font-semibold text-[#929baa]">系统</p>
      <div className="space-y-0.5">{system.map(([href, label, Icon]) => <NavLink key={href} href={href} label={label} icon={Icon} onClick={close} />)}</div>
    </nav>
  </aside>;
}

function SearchPalette({ items, open, onClose }: { items: SearchItem[]; open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const results = useMemo(() => query.trim() ? items.filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase())).slice(0, 12) : items.slice(0, 8), [items, query]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] bg-black/30 px-3 pt-[9vh]" onMouseDown={onClose} role="presentation"><div role="dialog" aria-modal="true" aria-label="全局搜索" className="mx-auto w-full max-w-[620px] overflow-hidden rounded-[8px] border border-[var(--border)] bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4"><Search size={18} className="text-[#768092]" /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} className="h-14 min-w-0 flex-1 bg-transparent outline-none" placeholder="搜索车位、账号、车友或联系方式" /><button onClick={onClose} className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[#697386]">ESC</button></div>
    <div className="max-h-[440px] overflow-y-auto p-2">{results.length ? results.map((item) => <button key={`${item.type}-${item.id}`} className="flex min-h-[54px] w-full items-center gap-3 rounded-[6px] px-3 text-left hover:bg-[#f4f6f8]" onClick={() => { router.push(item.href); onClose(); }}><span className="badge badge-neutral">{item.type}</span><span className="min-w-0"><strong className="block truncate text-[13px] font-semibold">{item.title}</strong><span className="block truncate text-[12px] text-[var(--muted-foreground)]">{item.subtitle}</span></span></button>) : <div className="empty">没有找到匹配结果</div>}</div>
  </div></div>;
}

export function AppShell({ children, platforms, reminderCount, username, role, searchItems }: { children: React.ReactNode; platforms: PlatformItem[]; reminderCount: number; username: string; role: string; searchItems: SearchItem[] }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") { setSearchOpen(false); setMobileNav(false); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, []);
  return <div className="flex min-h-dvh">
    <a href="#main-content" className="skip-link">跳到主要内容</a>
    <div className="fixed inset-y-0 left-0 z-40 desktop-only"><Sidebar platforms={platforms} reminderCount={reminderCount} /></div>
    {mobileNav && <div className="fixed inset-0 z-[90] bg-black/30" onClick={() => setMobileNav(false)}><div className="h-full w-[220px]" onClick={(e) => e.stopPropagation()}><Sidebar platforms={platforms} reminderCount={reminderCount} close={() => setMobileNav(false)} /></div></div>}
    <div className="min-w-0 flex-1 pl-[var(--sidebar-width)]">
      <header className="fixed left-[var(--sidebar-width)] right-0 top-0 z-30 flex h-[58px] items-center border-b border-[var(--border)] bg-white/95 px-4 backdrop-blur-sm md:px-5">
        <button className="btn icon-btn mobile-only mr-2" onClick={() => setMobileNav(true)} aria-label="打开菜单"><Menu size={18} /></button>
        <button onClick={() => setSearchOpen(true)} className="mx-auto flex h-9 w-full max-w-[430px] items-center gap-2 rounded-[6px] border border-[var(--border)] bg-[#fafbfc] px-3 text-left text-[13px] text-[#727c8d] hover:border-[#cbd2dc]"><Search size={15} /><span className="min-w-0 flex-1 truncate">搜索车位、账号、车友...</span><kbd className="desktop-only rounded border border-[#e2e6eb] bg-white px-1.5 py-0.5 text-[10px]">⌘ K</kbd></button>
        <div className="ml-3 flex items-center gap-1"><Link href="/reminders" className="btn icon-btn relative" aria-label={`到期提醒，${reminderCount} 条`} title="到期提醒"><Bell size={17} />{reminderCount > 0 && <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-[#d33d3d] px-1 text-[9px] leading-4 text-white">{Math.min(reminderCount, 99)}</span>}</Link><Link href="/settings" className="btn icon-btn desktop-only" aria-label="系统设置" title="系统设置"><Settings size={17} /></Link><div className="desktop-only ml-2 flex items-center gap-2 border-l border-[var(--border)] pl-3"><CircleUserRound size={22} className="text-[#697386]" /><div><div className="flex items-center gap-1 text-[12px] font-semibold">{username}<ChevronDown size={12} /></div><div className="text-[10px] text-[#8a94a3]">{role === "ADMIN" ? "管理员" : "操作员"}</div></div><form action={logoutAction}><button className="btn icon-btn ml-1" aria-label="退出登录" title="退出登录"><LogOut size={15} /></button></form></div></div>
      </header>
      <main id="main-content" className="min-h-dvh px-3 pb-8 pt-[78px] md:px-5 xl:px-6">{children}</main>
    </div>
    <SearchPalette items={searchItems} open={searchOpen} onClose={() => setSearchOpen(false)} />
  </div>;
}
