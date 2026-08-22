"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { revealPasswordAction } from "@/app/actions";

export function PasswordCell({ slotId }: { slotId: string }) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, startTransition] = useTransition();
  const reveal = () => startTransition(async () => {
    if (password) { setVisible(true); return; }
    const result = await revealPasswordAction(slotId);
    if (result.ok && result.data?.password) { setPassword(result.data.password); setVisible(true); toast.success(result.message); } else toast.error(result.message);
  });
  const copyPassword = async () => {
    if (!visible || !password) return;
    await navigator.clipboard.writeText(password);
    toast.success("密码已复制");
  };
  return <div className="flex w-[132px] items-center gap-2">
    <button type="button" disabled={!visible} onClick={copyPassword} className="min-w-0 flex-1 truncate text-left font-mono text-[12px] disabled:cursor-default disabled:opacity-100" aria-label={visible ? "复制密码" : "密码已隐藏"} title={visible ? "点击复制密码" : undefined}>{visible ? password : "••••••••"}</button>
    <button type="button" className="grid size-7 shrink-0 place-items-center rounded-[5px] text-[#657080] hover:bg-[var(--surface-subtle)]" disabled={pending} onClick={visible ? () => setVisible(false) : reveal} aria-label={visible ? "隐藏密码" : "查看密码"} title={visible ? "隐藏密码" : "查看密码"}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
  </div>;
}
