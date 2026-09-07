"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell, ChartNoAxesCombined, ChevronDown, CreditCard, Database,
  History, House, LoaderCircle, LogOut, Menu, MoreHorizontal,
  PanelLeft, ParkingCircle, Plus, Settings, UsersRound, X,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { GlobalSearch } from "@/components/global-search";
import { ThemePicker, ThemeToggle } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "业务", items: [["/", "总览", House], ["/slots", "合租车位", ParkingCircle], ["/members", "车友管理", UsersRound], ["/renewals", "续费记录", CreditCard], ["/reminders", "到期提醒", Bell]] },
  { label: "分析", items: [["/analytics", "数据统计", ChartNoAxesCombined]] },
  { label: "系统", items: [["/logs", "操作日志", History], ["/settings", "系统设置", Settings]] },
] as const;

const bottomNavigation = [
  ["/", "总览", House],
  ["/slots", "车位", ParkingCircle],
  ["/members", "车友", UsersRound],
  ["/reminders", "提醒", Bell],
  ["/settings", "更多", MoreHorizontal],
] as const;

const pageNames: Record<string, string> = {
  "/": "总览", "/slots": "合租车位", "/members": "车友管理",
  "/renewals": "续费记录", "/reminders": "到期提醒", "/analytics": "数据统计",
  "/logs": "操作日志", "/settings": "系统设置",
};

function routeIsActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavPending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className="grid size-4 shrink-0 place-items-center">{pending && <LoaderCircle size={13} className="nav-pending animate-spin" />}</span>;
}

function NavLink({ href, label, icon: Icon, badge, onClick }: { href: string; label: string; icon: typeof House; badge?: number; onClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [targetPath, query] = href.split("?");
  const active = href === "/" ? pathname === href : query ? pathname === targetPath && [...new URLSearchParams(query)].every(([key, value]) => searchParams.get(key) === value) : pathname.startsWith(targetPath);
  return <Link href={href} prefetch onClick={onClick} title={label} aria-current={active ? "page" : undefined} className={cn("nav-link", active && "nav-link-active")}>
    <span className="relative grid size-5 shrink-0 place-items-center"><Icon size={18} strokeWidth={1.8} /></span>
    <span className="nav-label min-w-0 flex-1 truncate">{label}</span>
    {badge !== undefined && badge > 0 && <span className="nav-badge">{badge > 99 ? "99+" : badge}</span>}
    <NavPending />
  </Link>;
}

function AccountMenu({ username, role, compact = false }: { username: string; role: string; compact?: boolean }) {
  return <details name="chewei-popover" className={cn("account-menu relative", compact ? "header-account-menu" : "sidebar-account-menu")}>
    <summary className={cn("account-trigger", compact && "header-account-trigger")} aria-label="打开账号菜单">
      <span className="account-avatar">{username.slice(0, 1).toUpperCase()}</span>
      {!compact && <><span className="account-copy min-w-0 flex-1 text-left"><strong className="block truncate text-[13px]">{username}</strong><small className="block truncate text-[10px] text-[var(--muted-foreground)]">{role === "ADMIN" ? "系统管理员" : "运营账号"}</small></span><ChevronDown className="account-chevron" size={15} /></>}
    </summary>
    <div className={cn("menu-popover account-popover z-50 w-[210px] rounded-lg border border-[var(--border)] p-1.5 shadow-xl", compact && "header-account-popover")}>
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-2.5 pb-2.5 pt-1.5"><span className="account-avatar">{username.slice(0, 1).toUpperCase()}</span><span className="min-w-0"><strong className="block truncate text-[13px] font-semibold">{username}</strong><span className="text-[11px] text-[var(--muted-foreground)]">{role === "ADMIN" ? "系统管理员" : "运营账号"}</span></span></div>
      <div className="border-b border-[var(--border)] py-2"><ThemePicker /></div>
      <form action={logoutAction} className="pt-1.5"><button className="menu-item menu-item-danger w-full"><LogOut size={15} /><span>退出登录</span></button></form>
    </div>
  </details>;
}

function QuickCreate() {
  const root = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") root.current?.removeAttribute("open"); };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, []);
  const done = () => root.current?.removeAttribute("open");
  const items = [
    ["/slots?create=1", "新增车位", ParkingCircle],
    ["/slots?status=空闲", "添加车友", UsersRound],
    ["/members", "办理续费", CreditCard],
    ["/settings?tab=backup", "数据备份", Database],
  ] as const;
  return <details ref={root} name="chewei-popover" className="quick-create relative">
    <summary className="quick-create-trigger" aria-label="打开快捷新建"><Plus size={18} /><span className="quick-create-label">新建</span><ChevronDown className="quick-create-chevron" size={14} /></summary>
    <div className="quick-create-popover">
      {items.map(([href, label, Icon]) => <Link key={href} href={href} onClick={done} className="quick-create-item"><Icon size={16} /><span>{label}</span></Link>)}
    </div>
  </details>;
}

function Sidebar({ reminderCount, username, role, close }: { reminderCount: number; username: string; role: string; close?: () => void }) {
  return <aside className={cn("sidebar flex h-full shrink-0 border-r", close && "sidebar-mobile")}>
    <div className="workspace-sidebar">
      <div className="workspace-sidebar-header"><Link href="/" className="product-mark" aria-label="车位管理系统总览"><ParkingCircle size={23} strokeWidth={1.8} /></Link><Link href="/" className="sidebar-wordmark"><strong>车位管理系统</strong><small>订阅运营工作台</small></Link>{close && <button autoFocus onClick={close} className="sidebar-icon-button" aria-label="关闭菜单"><X size={18} /></button>}</div>
      <div className="quick-create-wrap"><QuickCreate /></div>
      <nav className="workspace-navigation" aria-label="主导航">{navigation.map((group) => <section key={group.label} className="nav-section"><div className="nav-group-label">{group.label}</div><div className="space-y-0.5">{group.items.map(([href, label, Icon]) => <NavLink key={href} href={href} label={label} icon={Icon} badge={href === "/reminders" ? reminderCount : undefined} onClick={close} />)}</div></section>)}</nav>
      <div className="workspace-sidebar-footer"><AccountMenu username={username} role={role} /></div>
    </div>
  </aside>;
}

function MobileBottomNav({ reminderCount }: { reminderCount: number }) {
  const pathname = usePathname();
  return <nav className="mobile-bottom-nav mobile-only" aria-label="移动端主导航">{bottomNavigation.map(([href, label, Icon]) => { const active = routeIsActive(pathname, href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("mobile-bottom-link", active && "mobile-bottom-link-active")}><span className="relative"><Icon size={21} />{href === "/reminders" && reminderCount > 0 && <span className="mobile-bottom-badge">{reminderCount > 99 ? "99+" : reminderCount}</span>}</span><span>{label}</span></Link>; })}</nav>;
}

export function AppShell({ children, reminderCount, username, role }: { children: React.ReactNode; reminderCount: number; username: string; role: string }) {
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setCompact(localStorage.getItem("chewei-sidebar") === "compact"));
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileNav(false); };
    addEventListener("keydown", close);
    return () => { cancelAnimationFrame(frame); removeEventListener("keydown", close); };
  }, []);
  const toggle = () => setCompact((current) => { localStorage.setItem("chewei-sidebar", current ? "expanded" : "compact"); return !current; });
  const currentName = pageNames[pathname] || "车位管理系统";

  return <div className={cn("app-shell flex min-h-dvh", compact && "app-shell-compact")}>
    <a href="#main-content" className="skip-link">跳到主要内容</a>
    <div className="fixed inset-y-0 left-0 z-40 desktop-only"><Sidebar reminderCount={reminderCount} username={username} role={role} /></div>
    <div className="app-content min-w-0 flex-1">
      <header className="workspace-topbar">
        <button type="button" className="header-tool desktop-only" onClick={toggle} aria-label={compact ? "展开侧栏" : "收起侧栏"}><PanelLeft size={19} /></button>
        <button type="button" className="mobile-only header-tool" onClick={() => setMobileNav(true)} aria-label="打开侧栏"><Menu size={19} /></button>
        <span className="workspace-current truncate">{currentName}</span>
        <div className="workspace-search-slot"><GlobalSearch /></div>
        <div className="workspace-actions"><ThemeToggle className="header-tool desktop-only" /><Link href="/reminders" className="header-tool relative" aria-label="查看提醒"><Bell size={19} />{reminderCount > 0 && <span className="header-notification-dot" />}</Link><div className="mobile-only"><AccountMenu username={username} role={role} compact /></div></div>
      </header>
      <main id="main-content" className="app-main min-h-[calc(100dvh-56px)]">{children}</main>
    </div>
    <MobileBottomNav reminderCount={reminderCount} />
    {mobileNav && <div className="fixed inset-0 z-[90] bg-black/45" onClick={() => setMobileNav(false)}><div role="dialog" aria-modal="true" aria-label="移动导航" className="h-full w-[min(328px,88vw)]" onClick={(event) => event.stopPropagation()}><Sidebar reminderCount={reminderCount} username={username} role={role} close={() => setMobileNav(false)} /></div></div>}
  </div>;
}
