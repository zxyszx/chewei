import { Activity, Layers3, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { InstallAppButton } from "@/components/install-app-button";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-switcher";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="login-page min-h-dvh">
      <section className="login-shell flex min-h-dvh w-full overflow-hidden">
        <div className="relative hidden p-3 lg:flex lg:flex-1">
        <aside
          className="login-brand-panel relative flex w-full flex-col overflow-hidden rounded-[18px] px-14 py-12 text-white"
          aria-label="Chewei"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[7px] border border-white/15 bg-white/10 text-[#d4d4d4]">
              <Layers3 size={25} strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[17px] font-semibold leading-6">Chewei</p>
              <p className="mt-0.5 text-[10px] text-[#a9a9a9]">共享订阅管理</p>
            </div>
          </div>

          <div className="my-auto py-14">
            <p className="max-w-[430px] text-[36px] font-semibold leading-[1.3]">每个账号，每个席位，都有记录</p>
            <p className="mt-5 max-w-[420px] text-[14px] leading-7 text-[#b3b3b3]">集中管理合租账号、成员、续费和到期提醒。</p>
            <div className="mt-11 grid max-w-[420px] grid-cols-3 border-y border-white/10 py-5">
              {[["账号", "集中"], ["席位", "清晰"], ["续费", "可追溯"]].map(([label, value]) => <div key={label} className="border-r border-white/10 px-3 first:pl-0 last:border-0"><span className="block text-[10px] text-[#888]">{label}</span><strong className="mt-1.5 block text-[13px] font-medium text-[#f1f1f1]">{value}</strong></div>)}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-[#aaa]">
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#d4d4d4]" />私有部署</span>
            <span className="flex items-center gap-2"><Activity size={14} className="text-[#78b989]" />服务在线</span>
          </div>
        </aside>
        </div>

        <div className="relative flex min-h-dvh w-full flex-col border-l border-[var(--border)] px-6 py-8 sm:px-12 lg:w-[520px] lg:shrink-0 lg:px-14 lg:py-12">
          <div className="flex items-center gap-3 pr-12 lg:hidden">
            <span className="grid size-10 place-items-center rounded-[9px] bg-[var(--brand-panel)] text-white">
              <Layers3 size={23} strokeWidth={1.9} />
            </span>
            <span className="text-[17px] font-semibold">Chewei</span>
          </div>
          <ThemeToggle className="absolute right-6 top-7" />

          <div className="my-auto w-full py-14 sm:py-16 lg:py-8">
            <div className="mx-auto w-full max-w-[430px]">
              <header className="mb-8">
                <p className="mb-3 text-[11px] font-semibold text-[var(--primary)]">管理后台</p>
                <h1 className="text-[27px] font-semibold leading-tight text-[var(--foreground)]">登录 Chewei</h1>
                <p className="mt-3 text-[14px] leading-6 text-[var(--muted-foreground)]">
                  使用管理员或操作员账号继续
                </p>
              </header>
              <LoginForm />
            </div>
          </div>

          <footer className="mx-auto flex min-h-11 w-full max-w-[430px] flex-wrap items-center justify-center gap-3 border-t border-[var(--border)] pt-5 text-[12px] text-[#7b8493]">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} />
              会话已加密保护
            </span>
            <InstallAppButton showLabel />
          </footer>
        </div>
      </section>
    </main>
  );
}
