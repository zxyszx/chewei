import { Layers3 } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="login-page flex min-h-dvh flex-col bg-white lg:flex-row">
      <section className="relative hidden p-2 lg:flex lg:flex-1">
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#8794f6]">
          <object data="/saaslens-auth-bg.svg" type="image/svg+xml" className="absolute inset-0 h-full w-full" aria-hidden="true" />
          <div className="login-brand-content relative z-10 flex flex-col items-center gap-6 px-16 text-center text-white">
            <div className="flex items-center gap-3 text-[38px] font-bold leading-none">
              <Layers3 size={42} strokeWidth={2.15} />
              <span>Chewei</span>
            </div>
            <h1 className="text-[36px] font-semibold leading-[40px]">所有共享账号一目了然<br />席位清楚，续费不漏</h1>
            <p className="text-sm leading-5">实时到期提醒、统一车位管理、完整续费记录<br />让每一个账号和席位都清清楚楚。</p>
          </div>
        </div>
      </section>

      <section className="login-form-panel relative flex min-h-dvh w-full flex-col items-center justify-center px-6 py-14 sm:px-14 lg:w-[520px] lg:shrink-0">
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <Layers3 size={31} className="text-[var(--primary)]" />
          <strong className="text-[25px]">Chewei</strong>
        </div>
        <div className="login-form-card w-full max-w-[400px]">
          <header className="mb-6 flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">登录</h1>
            <p className="text-sm text-[var(--muted-foreground)]">使用后台账号登录 Chewei</p>
          </header>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
