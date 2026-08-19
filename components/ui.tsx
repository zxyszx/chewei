"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
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

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="page-title">{title}</h1>{description && <p className="page-description">{description}</p>}</div>{actions}</div>;
}
