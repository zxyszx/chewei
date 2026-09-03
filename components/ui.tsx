"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "success" | "danger" | "warning" | "urgent" | "notice" | "neutral" | "blue"; className?: string }) {
  return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>;
}

export function SubmitButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={cn("btn btn-primary", className)} {...props}>{pending && <LoaderCircle size={15} className="animate-spin" />}{pending ? "正在保存" : children}</button>;
}

export function PageHeader({ title, description, leading, actions }: { title: string; description?: string; leading?: ReactNode; actions?: ReactNode }) {
  return <header className="page-header flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3">{leading}<div className="min-w-0"><h1 className="page-title">{title}</h1>{description && <p className="page-description">{description}</p>}</div></div>{actions}</header>;
}

export function MetricCard({ label, value, detail, icon: Icon, tone = "blue", className }: { label: string; value: ReactNode; detail?: ReactNode; icon: LucideIcon; tone?: "blue" | "green" | "orange" | "red"; className?: string }) {
  return <article className={cn("panel metric-card flex items-center gap-4", className)}><span className={`metric-icon icon-tone-${tone}`}><Icon size={22} aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-medium text-[var(--muted-foreground)]">{label}</p><strong className="mt-1 block text-[26px] font-bold leading-8 tabular">{value}</strong>{detail && <div className="mt-1 text-[12px] text-[var(--muted-foreground)]">{detail}</div>}</div></article>;
}

export function ProgressBar({ value, label, tone = "blue" }: { value: number; label: string; tone?: "blue" | "green" | "orange" | "red" }) {
  const safe = Math.max(0, Math.min(100, value));
  return <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safe)}><span className={`progress-fill progress-${tone}`} style={{ width: `${safe}%` }} /></div>;
}
