"use client";

import { ClipboardCopy, Copy, Eye, EyeOff, Link2, LoaderCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { copyCredentialBundleAction, copyVerificationUrlAction, revealPasswordAction } from "@/app/actions";
import { formatCredentialBundle } from "@/lib/credential-copy";

export function PasswordCell({ slotId, hasVerificationUrl }: { slotId: string; hasVerificationUrl: boolean }) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, startTransition] = useTransition();
  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
      return true;
    } catch {
      toast.error("复制失败，请检查浏览器剪贴板权限");
      return false;
    }
  };
  useEffect(() => {
    const reset = (event: Event) => {
      const detail = (event as CustomEvent<{ slotId?: string }>).detail;
      if (!detail?.slotId || detail.slotId === slotId) {
        setPassword("");
        setVisible(false);
      }
    };
    window.addEventListener("parking-password-updated", reset);
    return () => window.removeEventListener("parking-password-updated", reset);
  }, [slotId]);
  const reveal = () => startTransition(async () => {
    if (password) { setVisible(true); return; }
    const result = await revealPasswordAction(slotId);
    if (result.ok && result.data?.password) { setPassword(result.data.password); setVisible(true); toast.success(result.message); } else toast.error(result.message);
  });
  const copyPassword = () => startTransition(async () => {
    let value = password;
    if (!value) {
      const result = await revealPasswordAction(slotId, "copy");
      if (!result.ok || !result.data?.password) { toast.error(result.message); return; }
      value = result.data.password;
      setPassword(value);
    }
    await copy(value, "密码已复制，此操作已记录");
  });
  const copyVerificationUrl = () => startTransition(async () => {
    const result = await copyVerificationUrlAction(slotId);
    if (!result.ok || !result.data?.verificationUrl) { toast.error(result.message); return; }
    await copy(result.data.verificationUrl, "验证码链接已复制，此操作已记录");
  });
  const copyAll = () => startTransition(async () => {
    const result = await copyCredentialBundleAction(slotId);
    const accountEmail = result.data?.accountEmail;
    const copiedPassword = result.data?.password;
    const verificationUrl = result.data?.verificationUrl;
    if (!result.ok || !accountEmail || !copiedPassword || !verificationUrl) { toast.error(result.message); return; }
    const copied = await copy(formatCredentialBundle({ accountEmail, password: copiedPassword, verificationUrl }), "账号、密码和链接已复制，此操作已记录");
    if (copied) setPassword(copiedPassword);
  });
  return <div className="flex w-[198px] items-center gap-1">
    <button type="button" onClick={copyPassword} disabled={pending} className="group flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-[5px] px-1 py-1 text-left font-mono text-[12px] hover:bg-[var(--surface-subtle)]" aria-label="复制密码" title="点击复制密码"><span className="min-w-0 flex-1 truncate">{visible ? password : "••••••••"}</span><Copy size={13} className="shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" /></button>
    <button type="button" className="credential-icon-button" disabled={pending} onClick={visible ? () => setVisible(false) : reveal} aria-label={visible ? "隐藏密码" : "查看密码"} title={visible ? "隐藏密码" : "查看密码"}>{pending ? <LoaderCircle size={15} className="animate-spin" /> : visible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
    <button type="button" className="credential-icon-button" disabled={pending || !hasVerificationUrl} onClick={copyVerificationUrl} aria-label={hasVerificationUrl ? "复制验证码链接" : "未设置验证码链接"} title={hasVerificationUrl ? "复制验证码链接" : "未设置验证码链接"}><Link2 size={15} /></button>
    <button type="button" className="credential-icon-button credential-copy-all" disabled={pending || !hasVerificationUrl} onClick={copyAll} aria-label={hasVerificationUrl ? "复制账号、密码和验证码链接" : "请先设置验证码链接"} title={hasVerificationUrl ? "复制全部凭据" : "请先设置验证码链接"}><ClipboardCopy size={15} /></button>
  </div>;
}
