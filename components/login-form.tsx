"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";
import { loginAction, type ActionState } from "@/app/actions";

const initialState: ActionState = { ok: false, message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  return <form action={action} autoComplete="on" className="flex w-full flex-col gap-4">
    <div>
      <label className="label" htmlFor="username">账号</label>
      <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required className="input login-input" placeholder="请输入管理员账号" defaultValue="admin" />
    </div>
    <div>
      <label className="label" htmlFor="password">密码</label>
      <div className="relative">
        <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="input login-input pr-12" placeholder="请输入密码" />
        <button type="button" onClick={() => setShowPassword((value) => !value)} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[5px] text-[#727c8c] hover:bg-[#f2f4f7] focus-visible:outline-[#6b7470]" aria-label={showPassword ? "隐藏密码" : "显示密码"} title={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
      </div>
    </div>
    {state.message && <p role="alert" className="rounded-md border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-3 py-2.5 text-[13px] text-[var(--danger)]">{state.message}</p>}
    <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full">{pending && <LoaderCircle size={17} className="animate-spin" />}{pending ? "正在登录" : "登录"}</button>
  </form>;
}
