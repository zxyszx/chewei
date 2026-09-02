"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell, ChartNoAxesCombined, ChevronDown, CreditCard, History, House,
  LoaderCircle, LogOut, Menu, PanelLeft, ParkingCircle,
  Settings, UsersRound, X,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { InstallAppButton } from "@/components/install-app-button";
import { ThemePicker } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "业务", items: [["/", "总览", House], ["/slots", "合租车位", ParkingCircle], ["/members", "车友", UsersRound], ["/renewals", "续费", CreditCard], ["/reminders", "提醒", Bell]] },
  { label: "分析", items: [["/analytics", "数据统计", ChartNoAxesCombined]] },
  { label: "系统", items: [["/logs", "操作日志", History], ["/settings", "系统设置", Settings]] },
] as const;

function NavPending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className="grid size-4 shrink-0 place-items-center">{pending && <LoaderCircle size={13} className="nav-pending animate-spin" />}</span>;
}

function NavLink({ href, label, icon: Icon, badge, compact = false, onClick }: { href: string; label: string; icon: typeof House; badge?: number; compact?: boolean; onClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [targetPath, query] = href.split("?");
  const active = href === "/" ? pathname === href : query ? pathname === targetPath && [...new URLSearchParams(query)].every(([key, value]) => searchParams.get(key) === value) : targetPath === "/slots" ? pathname === targetPath && !searchParams.get("platform") : pathname.startsWith(targetPath);
  return <Link href={href} prefetch onClick={onClick} title={compact ? label : undefined} aria-label={compact ? label : undefined} className={cn("nav-link", compact && "justify-center px-0", active && "nav-link-active")}>
    <span className="relative grid size-5 shrink-0 place-items-center"><Icon size={18} strokeWidth={1.8} />{compact && badge !== undefined && badge > 0 && <span className="nav-dot" />}</span>
    {!compact && <><span className="min-w-0 flex-1 truncate">{label}</span>{badge !== undefined && <span className="nav-badge">{badge}</span>}<NavPending /></>}
  </Link>;
}

function AccountMenu({ username, role, compact }: { username: string; role: string; compact: boolean }) {
  return <details className={cn("account-menu relative", compact && "account-menu-compact")}>
    <summary className={cn("account-trigger", compact ? "justify-center p-0" : "w-full px-2")} aria-label="打开账号菜单" title={compact ? `${username} · 打开账号菜单` : undefined}>
      <span className="account-avatar">{username.slice(0, 1).toUpperCase()}</span>
      {!compact && <><span className="min-w-0 flex-1 text-left"><strong className="block truncate text-[12px] font-semibold">{username}</strong><span className="block text-[10px] text-[var(--muted-foreground)]">{role === "ADMIN" ? "管理员" : "操作员"}</span></span><ChevronDown size={14} className="text-[var(--muted-foreground)]" /></>}
    </summary>
    <div className="menu-popover account-popover z-50 w-[240px] rounded-[8px] border border-[var(--border)] p-1.5 shadow-xl">
      <div className="border-b border-[var(--border)] px-2.5 pb-2.5 pt-1.5"><p className="truncate text-[13px] font-semibold">{username}</p><p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{role === "ADMIN" ? "系统管理员" : "运营账号"}</p></div>
      <div className="py-1.5"><Link href="/settings" className="menu-item"><Settings size={15} /><span>系统设置</span></Link><InstallAppButton showLabel /></div>
      <div className="border-y border-[var(--border)] py-1.5"><p className="px-2.5 pb-1 text-[10px] font-semibold text-[var(--muted-foreground)]">外观</p><ThemePicker /></div>
      <form action={logoutAction} className="pt-1.5"><button className="menu-item menu-item-danger w-full"><LogOut size={15} /><span>退出登录</span></button></form>
    </div>
  </details>;
}

function SidebarToggle({ compact, toggle }: { compact: boolean; toggle: () => void }) {
  const label = compact ? "打开侧边栏" : "收起侧边栏";
  return <button onClick={toggle} className={cn("sidebar-icon-button sidebar-toggle group relative", compact && "sidebar-toggle-compact")} aria-label={label}>
    <PanelLeft size={19} strokeWidth={1.8} />
    <span role="tooltip" className="sidebar-toggle-tooltip">{label}</span>
  </button>;
}

function Sidebar({ reminderCount, username, role, compact = false, close, toggleCompact }: { reminderCount: number; username: string; role: string; compact?: boolean; close?: () => void; toggleCompact?: () => void }) {
  return <aside className={cn("sidebar flex h-full shrink-0 flex-col border-r border-[var(--border)] transition-[width] duration-200", compact ? "w-[56px]" : "w-[224px]")}>
    <div className={cn("flex h-14 shrink-0 items-center", compact ? "justify-center" : "gap-2 px-3")}>
      {compact ? toggleCompact && <SidebarToggle compact toggle={toggleCompact} /> : <><div className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"><ParkingCircle size={19} /></div><strong className="min-w-0 flex-1 truncate text-[14px]">车位管理系统</strong>{toggleCompact && <SidebarToggle compact={false} toggle={toggleCompact} />}</>}
      {close && <button autoFocus onClick={close} className="sidebar-icon-button ml-auto" aria-label="关闭菜单"><X size={18} /></button>}
    </div>
    <nav className={cn("flex-1 overflow-y-auto py-2", compact ? "px-1.5" : "px-2.5")} aria-label="主导航">
      {navigation.map((group, groupIndex) => <div key={group.label} className={groupIndex ? "mt-4" : ""}>
        {!compact && <p className="nav-group-label">{group.label}</p>}
        {compact && groupIndex > 0 && <div className="mx-auto my-3 h-px w-6 bg-[var(--border)]" />}
        <div className="space-y-0.5">{group.items.map(([href, label, Icon]) => <NavLink key={href} href={href} label={label} icon={Icon} badge={href === "/reminders" ? reminderCount : undefined} compact={compact} onClick={close} />)}</div>
      </div>)}
    </nav>
    <div className={cn("shrink-0 border-t border-[var(--border)]", compact ? "p-1.5" : "p-2")}><AccountMenu username={username} role={role} compact={compact} /></div>
  </aside>;
}

export function AppShell({ children, reminderCount, username, role }: { children: React.ReactNode; reminderCount: number; username: string; role: string }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSidebarCompact(window.localStorage.getItem("parking-sidebar") === "compact"));
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileNav(false); };
    window.addEventListener("keydown", handler);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("keydown", handler); };
  }, []);
  const toggleSidebar = () => setSidebarCompact((current) => {
    window.localStorage.setItem("parking-sidebar", current ? "expanded" : "compact");
    return !current;
  });
  return <div className="flex min-h-dvh" style={{ "--sidebar-width": sidebarCompact ? "56px" : "224px" } as React.CSSProperties}>
    <a href="#main-content" className="skip-link">跳到主要内容</a>
    <div className="fixed inset-y-0 left-0 z-40 desktop-only"><Sidebar reminderCount={reminderCount} username={username} role={role} compact={sidebarCompact} toggleCompact={toggleSidebar} /></div>
    <button className="mobile-sidebar-trigger mobile-only" onClick={() => setMobileNav(true)} aria-label="打开侧栏" title="打开侧栏"><Menu size={19} /></button>
    {mobileNav && <div className="fixed inset-0 z-[90] bg-black/35" onClick={() => setMobileNav(false)}><div role="dialog" aria-modal="true" aria-label="移动导航" className="h-full w-[224px]" onClick={(event) => event.stopPropagation()}><Sidebar reminderCount={reminderCount} username={username} role={role} close={() => setMobileNav(false)} /></div></div>}
    <div className="app-content min-w-0 flex-1 pl-[var(--sidebar-width)]"><main id="main-content" className="app-main min-h-dvh px-3 pb-8 md:px-5 xl:px-6">{children}</main></div>
  </div>;
}
