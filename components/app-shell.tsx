"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell, ChartNoAxesCombined, CreditCard, History, House,
  Layers3, LoaderCircle, LogOut, Menu, PanelLeft, ParkingCircle,
  Settings, UsersRound, X,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { GlobalSearch } from "@/components/global-search";
import { ThemePicker } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "主要", color: "#6366f1", items: [["/", "总览", House], ["/analytics", "数据统计", ChartNoAxesCombined]] },
  { label: "管理", color: "#f59e0b", items: [["/slots", "合租车位", ParkingCircle], ["/members", "车友管理", UsersRound], ["/renewals", "续费记录", CreditCard], ["/reminders", "到期提醒", Bell]] },
  { label: "系统", color: "#64748b", items: [["/logs", "操作日志", History], ["/settings", "系统设置", Settings]] },
] as const;

function NavPending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className="grid size-4 shrink-0 place-items-center">{pending && <LoaderCircle size={13} className="nav-pending animate-spin" />}</span>;
}

function NavLink({ href, label, icon: Icon, badge, compact, onClick }: { href: string; label: string; icon: typeof House; badge?: number; compact: boolean; onClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [targetPath, query] = href.split("?");
  const active = href === "/" ? pathname === href : query ? pathname === targetPath && [...new URLSearchParams(query)].every(([key, value]) => searchParams.get(key) === value) : pathname.startsWith(targetPath);
  return <Link href={href} prefetch onClick={onClick} title={compact ? label : undefined} aria-current={active ? "page" : undefined} className={cn("nav-link", compact && "nav-link-compact", active && "nav-link-active")}>
    <span className="relative grid size-5 shrink-0 place-items-center"><Icon size={18} strokeWidth={1.8} />{compact && badge !== undefined && badge > 0 && <span className="nav-dot" />}</span>
    {!compact && <><span className="min-w-0 flex-1 truncate">{label}</span>{badge !== undefined && badge > 0 && <span className="nav-badge">{badge > 99 ? "99+" : badge}</span>}<NavPending /></>}
  </Link>;
}

function AccountMenu({ username, role }: { username: string; role: string }) {
  return <details name="chewei-popover" className="account-menu header-account-menu relative">
    <summary className="account-trigger header-account-trigger" aria-label="打开账号菜单">
      <span className="account-avatar">{username.slice(0, 1).toUpperCase()}</span>
    </summary>
    <div className="menu-popover account-popover header-account-popover z-50 w-[210px] rounded-lg border border-[var(--border)] p-1.5 shadow-xl">
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-2.5 pb-2.5 pt-1.5"><span className="account-avatar">{username.slice(0, 1).toUpperCase()}</span><span className="min-w-0"><strong className="block truncate text-[13px] font-semibold">{username}</strong><span className="text-[11px] text-[var(--muted-foreground)]">{role === "ADMIN" ? "系统管理员" : "运营账号"}</span></span></div>
      <div className="border-b border-[var(--border)] py-2"><ThemePicker /></div>
      <form action={logoutAction} className="pt-1.5"><button className="menu-item menu-item-danger w-full"><LogOut size={15} /><span>退出登录</span></button></form>
    </div>
  </details>;
}

function Sidebar({ reminderCount, compact = false, close }: { reminderCount: number; compact?: boolean; close?: () => void }) {
  return <aside className={cn("sidebar flex h-full shrink-0 flex-col border-r transition-[width] duration-200", compact ? "w-16" : "w-64")}>
    <div className={cn("flex h-[72px] shrink-0 items-center", compact ? "justify-center" : "gap-2.5 px-5")}>
      <Link href="/" className={cn("sidebar-wordmark flex items-center gap-2.5", compact && "justify-center")} aria-label="Chewei 总览"><Layers3 size={compact ? 25 : 28} strokeWidth={2.1} /><strong className={cn("text-[20px] font-bold", compact && "sr-only")}>Chewei</strong></Link>
      {close && <button autoFocus onClick={close} className="sidebar-icon-button ml-auto" aria-label="关闭菜单"><X size={18} /></button>}
    </div>
    <nav className={cn("flex-1 overflow-y-auto pb-3", compact ? "px-2" : "px-3")} aria-label="主导航">
      {navigation.map((group, index) => <section key={group.label} className={index ? "mt-5" : ""}>
        {!compact && <div className="nav-group-label"><span style={{ backgroundColor: group.color }} />{group.label}</div>}
        {compact && index > 0 && <div className="mx-auto my-3 h-px w-7 bg-[var(--border)]" />}
        <div className="space-y-1">{group.items.map(([href, label, Icon]) => <NavLink key={href} href={href} label={label} icon={Icon} badge={href === "/reminders" ? reminderCount : undefined} compact={compact} onClick={close} />)}</div>
      </section>)}
    </nav>
  </aside>;
}

export function AppShell({ children, reminderCount, username, role }: { children: React.ReactNode; reminderCount: number; username: string; role: string }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setCompact(localStorage.getItem("chewei-sidebar") === "compact"));
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileNav(false); };
    addEventListener("keydown", close);
    return () => { cancelAnimationFrame(frame); removeEventListener("keydown", close); };
  }, []);
  const toggle = () => setCompact((current) => { localStorage.setItem("chewei-sidebar", current ? "expanded" : "compact"); return !current; });

  return <div className="app-shell flex min-h-dvh" style={{ "--sidebar-width": compact ? "64px" : "256px" } as React.CSSProperties}>
    <a href="#main-content" className="skip-link">跳到主要内容</a>
    <div className="fixed inset-y-0 left-0 z-40 desktop-only"><Sidebar reminderCount={reminderCount} compact={compact} /></div>
    <div className="app-content min-w-0 flex-1 pl-[var(--sidebar-width)]">
      <header className="workspace-topbar">
        <button type="button" className="header-tool desktop-only" onClick={toggle} aria-label={compact ? "展开侧栏" : "收起侧栏"}><PanelLeft size={19} /></button>
        <button type="button" className="mobile-only header-tool" onClick={() => setMobileNav(true)} aria-label="打开侧栏"><Menu size={19} /></button>
        <span className="header-separator" />
        <div className="flex min-w-0 flex-1 items-center"><GlobalSearch /></div>
        <div className="flex items-center gap-1">
          <Link href="/reminders" className="header-tool relative" aria-label="查看提醒"><Bell size={19} />{reminderCount > 0 && <span className="header-notification-dot" />}</Link>
          <span className="header-separator mx-2 desktop-only" />
          <AccountMenu username={username} role={role} />
        </div>
      </header>
      <main id="main-content" className="app-main min-h-[calc(100dvh-55px)] px-4 pb-10 md:px-6 xl:px-8">{children}</main>
    </div>
    {mobileNav && <div className="fixed inset-0 z-[90] bg-black/45" onClick={() => setMobileNav(false)}><div role="dialog" aria-modal="true" aria-label="移动导航" className="h-full w-64" onClick={(event) => event.stopPropagation()}><Sidebar reminderCount={reminderCount} close={() => setMobileNav(false)} /></div></div>}
  </div>;
}
