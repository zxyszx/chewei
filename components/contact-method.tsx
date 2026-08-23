import { MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export type ContactType = "WECHAT" | "TELEGRAM" | "N";

export const contactTypeOptions: Array<{ value: ContactType; label: string }> = [
  { value: "WECHAT", label: "微信" },
  { value: "TELEGRAM", label: "Telegram" },
  { value: "N", label: "N" },
];

export function normalizeContactType(type?: string | null, contact?: string): ContactType {
  if (type === "WECHAT" || type === "TELEGRAM" || type === "N") return type;
  return contact?.startsWith("@") ? "TELEGRAM" : "WECHAT";
}

export function cleanContactValue(value: string, type?: string | null) {
  const normalized = normalizeContactType(type, value);
  const prefixes: Record<ContactType, RegExp> = {
    WECHAT: /^微信\s*[:：]\s*/i,
    TELEGRAM: /^telegram\s*[:：]\s*/i,
    N: /^n\s*[:：]\s*/i,
  };
  return value.replace(prefixes[normalized], "");
}

export function ContactIcon({ type, size = 15 }: { type?: string | null; size?: number }) {
  const normalized = normalizeContactType(type);
  if (normalized === "TELEGRAM") return <Send size={size} aria-hidden="true" />;
  if (normalized === "N") return <span aria-hidden="true" className="grid size-[18px] place-items-center rounded-full bg-[#171717] text-[10px] font-semibold text-white">N</span>;
  return <MessageCircle size={size} aria-hidden="true" />;
}

export function ContactValue({ type, value, className }: { type?: string | null; value: string; className?: string }) {
  const normalized = normalizeContactType(type, value);
  const displayValue = cleanContactValue(value, normalized);
  const label = contactTypeOptions.find((option) => option.value === normalized)?.label || "联系方式";
  return <span className={cn("inline-flex min-w-0 items-center gap-1.5", normalized === "WECHAT" ? "text-[#07855b]" : normalized === "TELEGRAM" ? "text-[#168bd2]" : "text-[var(--foreground)]", className)} title={`${label}: ${displayValue}`}><ContactIcon type={normalized} /><span className="min-w-0 truncate text-[var(--foreground)]">{displayValue}</span></span>;
}
