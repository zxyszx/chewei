"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { useActionState, useState } from "react";
import { loginAction, type ActionState } from "@/app/actions";

const initialState: ActionState = { ok: false, message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  return <form action={action} autoComplete="on" className="flex w-full flex-col gap-6">
    <div className="login-field">
      <label className="label" htmlFor="username">账号</label>
      <div className="login-input-wrap">
        <UserRound size={17} aria-hidden="true" />
        <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required className="input login-input" placeholder="请输入管理员账号" defaultValue="admin" />
      </div>
    </div>
    <div className="login-field">
      <label className="label" htmlFor="password">密码</label>
      <div className="login-input-wrap relative">
        <LockKeyhole size={17} aria-hidden="true" />
        <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="input login-input pr-12" placeholder="请输入密码" />
        <button type="button" onClick={() => setShowPassword((value) => !value)} className="login-password-toggle" aria-label={showPassword ? "隐藏密码" : "显示密码"} title={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
      </div>
    </div>
    {state.message && <p role="alert" className="rounded-md border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-3 py-2.5 text-[13px] text-[var(--danger)]">{state.message}</p>}
    <button type="submit" disabled={pending} className="btn btn-primary login-submit mt-1 w-full">{pending && <LoaderCircle size={17} className="animate-spin" />}{pending ? "正在登录" : "进入工作台"}</button>
  </form>;
}
