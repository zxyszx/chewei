"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Bell, ChevronDown, CreditCard, House, Layers3, LogOut, Menu, ScrollText, Settings, UsersRound, X } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { ThemePicker, ThemeToggle } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

const navigation = [
  ["/", "总览", House], ["/analytics", "平台", BarChart3], ["/slots", "合租", Layers3],
  ["/members", "成员", UsersRound], ["/reminders", "订阅", Bell], ["/renewals", "账单", CreditCard], ["/logs", "日志", ScrollText],
] as const;

function routeIsActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Brand() {
  return <Link href="/" className="topnav-brand" aria-label="妙妙屋总览"><Image src="/brand-logo.webp" alt="" width={38} height={38} priority /><strong>妙妙屋</strong></Link>;
}

function AccountMenu({ username, role }: { username: string; role: string }) {
  return <details name="chewei-popover" className="topnav-account relative">
    <summary className="topnav-account-trigger" aria-label="打开账号菜单"><Image src="/admin-avatar.webp" alt="" width={32} height={32} /><span className="topnav-account-copy"><strong>{username}</strong><small>{role === "ADMIN" ? "ADMIN" : "OPERATOR"}</small></span><ChevronDown size={14} /></summary>
    <div className="menu-popover topnav-account-popover"><Link href="/settings" className="menu-item"><Settings size={15} /><span>系统设置</span></Link><div className="border-y border-[var(--border)] py-1.5"><ThemePicker /></div><form action={logoutAction}><button className="menu-item menu-item-danger w-full"><LogOut size={15} /><span>退出登录</span></button></form></div>
  </details>;
}

export function AppShell({ children, reminderCount, username, role }: { children: React.ReactNode; reminderCount: number; username: string; role: string }) {
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileNav(false); };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, []);

  return <div className="app-shell min-h-dvh">
    <a href="#main-content" className="skip-link">跳到主要内容</a>
    <header className="topnav"><div className="topnav-inner">
      <Brand />
      <nav className="topnav-links desktop-nav" aria-label="主导航">{navigation.map(([href, label]) => <Link key={href} href={href} aria-current={routeIsActive(pathname, href) ? "page" : undefined} className={cn("topnav-link", routeIsActive(pathname, href) && "topnav-link-active")}>{label}{href === "/reminders" && reminderCount > 0 && <span className="topnav-badge">{reminderCount > 99 ? "99+" : reminderCount}</span>}</Link>)}</nav>
      <div className="topnav-actions"><ThemeToggle className="topnav-icon-button" /><AccountMenu username={username} role={role} /><button type="button" className="topnav-icon-button mobile-nav-trigger" onClick={() => setMobileNav(true)} aria-label="打开导航"><Menu size={19} /></button></div>
    </div></header>
    <main id="main-content" className="app-main">{children}</main>
    {mobileNav && <div className="mobile-nav-backdrop" onClick={() => setMobileNav(false)}><aside role="dialog" aria-modal="true" aria-label="移动导航" className="mobile-nav-panel" onClick={(event) => event.stopPropagation()}><div className="mobile-nav-header"><Brand /><button className="topnav-icon-button" onClick={() => setMobileNav(false)} aria-label="关闭导航"><X size={19} /></button></div><nav className="mobile-nav-links">{navigation.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => setMobileNav(false)} className={cn("mobile-nav-link", routeIsActive(pathname, href) && "mobile-nav-link-active")}><Icon size={18} /><span>{label}</span>{href === "/reminders" && reminderCount > 0 && <span className="topnav-badge">{reminderCount}</span>}</Link>)}</nav></aside></div>}
  </div>;
}
