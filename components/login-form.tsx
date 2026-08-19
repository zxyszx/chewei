"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { useActionState, useState } from "react";
import { loginAction, type ActionState } from "@/app/actions";

const initialState: ActionState = { ok: false, message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  return <form action={action} className="mx-auto flex w-full max-w-[410px] flex-col gap-3">
    <div><label className="label mb-2" htmlFor="username">管理员账号</label><div className="flex min-h-[50px] items-center gap-3 rounded-[7px] border border-[var(--border-strong)] px-3.5 focus-within:border-[#7aa2ef] focus-within:shadow-[0_0_0_3px_rgb(37_99_235/10%)]"><UserRound size={18} className="text-[#7b8493]" /><input id="username" name="username" autoComplete="username" required className="h-12 min-w-0 flex-1 bg-transparent outline-none" placeholder="请输入管理员账号" /></div></div>
    <div className="mt-1"><label className="label mb-2" htmlFor="password">密码</label><div className="flex min-h-[50px] items-center gap-3 rounded-[7px] border border-[var(--border-strong)] px-3.5 focus-within:border-[#7aa2ef] focus-within:shadow-[0_0_0_3px_rgb(37_99_235/10%)]"><LockKeyhole size={18} className="text-[#7b8493]" /><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="h-12 min-w-0 flex-1 bg-transparent outline-none" placeholder="请输入密码" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="grid size-10 place-items-center rounded-[5px] text-[#727c8c] hover:bg-[#f2f4f7]" aria-label={showPassword ? "隐藏密码" : "显示密码"} title={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
    {state.message && <p role="alert" className="mt-1 border-l-[3px] border-[#d04444] bg-[#fff2f2] px-3 py-2.5 text-[13px] text-[#b62f2f]">{state.message}</p>}
    <button type="submit" disabled={pending} className="btn btn-primary mt-2 min-h-[48px] w-full text-[14px]">{pending ? <LoaderCircle size={18} className="animate-spin" /> : <LockKeyhole size={17} />}{pending ? "正在登录" : "登录"}</button>
  </form>;
}
