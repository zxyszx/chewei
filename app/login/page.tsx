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
    <main className="login-page flex min-h-dvh items-stretch lg:items-center lg:p-6">
      <section className="login-shell mx-auto grid min-h-dvh w-full overflow-hidden lg:min-h-[650px] lg:max-w-[1120px] lg:grid-cols-[0.9fr_1.1fr] lg:rounded-[10px] lg:border lg:border-[var(--border)] lg:shadow-[0_24px_80px_rgb(0_0_0/18%)]">
        <aside
          className="login-brand-panel relative hidden overflow-hidden px-11 py-11 text-white lg:flex lg:flex-col"
          aria-label="Chewei"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[9px] border border-white/15 bg-white/10 text-[#59d8b6]">
              <Layers3 size={25} strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[17px] font-semibold leading-6">Chewei</p>
              <p className="mt-0.5 text-[10px] text-[#9ca7a3]">OPERATIONS CONSOLE</p>
            </div>
          </div>

          <div className="my-auto py-14">
            <p className="max-w-[360px] text-[30px] font-semibold leading-[1.35]">共享订阅，清楚掌握</p>
            <p className="mt-4 max-w-[340px] text-[13px] leading-7 text-[#aab4b0]">账号、席位、续费与到期状态集中在一个工作区。</p>
            <div className="mt-10 grid max-w-[340px] grid-cols-3 border-y border-white/10 py-5">
              {[["账号", "集中"], ["席位", "清晰"], ["续费", "可追溯"]].map(([label, value]) => <div key={label} className="border-r border-white/10 px-3 first:pl-0 last:border-0"><span className="block text-[10px] text-[#7f8b87]">{label}</span><strong className="mt-1.5 block text-[13px] font-medium text-[#e7ecea]">{value}</strong></div>)}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-[#9ca7a3]">
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#59d8b6]" />私有部署</span>
            <span className="flex items-center gap-2"><Activity size={14} className="text-[#59d8b6]" />服务在线</span>
          </div>
        </aside>

        <div className="relative flex min-h-dvh flex-col px-6 py-8 sm:px-12 lg:min-h-0 lg:px-16 lg:py-12">
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
                <p className="mb-3 text-[11px] font-semibold text-[var(--accent)]">CHEWEI WORKSPACE</p>
                <h1 className="text-[27px] font-semibold leading-tight text-[var(--foreground)]">登录工作区</h1>
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
