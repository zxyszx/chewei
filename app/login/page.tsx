import { Layers3, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { InstallAppButton } from "@/components/install-app-button";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-switcher";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="login-page flex min-h-dvh items-stretch lg:items-center lg:p-8">
      <section className="login-shell mx-auto grid min-h-dvh w-full overflow-hidden lg:min-h-[680px] lg:max-w-[1180px] lg:grid-cols-[1.02fr_0.98fr] lg:rounded-[8px] lg:border lg:border-[var(--border)] lg:shadow-[0_24px_70px_rgb(15_23_42/10%)]">
        <aside
          className="relative hidden overflow-hidden bg-[var(--brand-panel)] px-12 py-12 text-white lg:flex lg:flex-col"
          aria-label="Chewei"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-white text-[var(--accent)]">
              <Layers3 size={25} strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[18px] font-semibold leading-6">
                Chewei
              </p>
              <p className="mt-0.5 text-[12px] text-[#bdbdbd]">SHARED ACCOUNT OPS</p>
            </div>
          </div>

          <div className="my-auto py-14">
            <p className="max-w-[390px] text-[32px] font-semibold leading-[1.3]">
              共享账号运营中心
            </p>
            <p className="mt-4 max-w-[420px] text-[14px] leading-7 text-[#bdbdbd]">
              集中处理账号、席位、成员、续费和到期提醒。
            </p>
            <div className="mt-10 h-px w-full max-w-[360px] bg-white/15" />
          </div>

          <div className="flex items-center gap-2 border-t border-white/15 pt-6 text-[13px] text-[#dedede]">
            <ShieldCheck size={16} className="text-[#7dd3fc]" />
            私有部署 · 数据留在自己的服务器
          </div>
        </aside>

        <div className="relative flex min-h-dvh flex-col px-6 py-8 sm:px-12 lg:min-h-0 lg:px-16 lg:py-12">
          <div className="flex items-center gap-3 pr-12 lg:hidden">
            <span className="grid size-10 place-items-center rounded-full bg-[var(--brand-panel)] text-white">
              <Layers3 size={23} strokeWidth={1.9} />
            </span>
            <span className="text-[17px] font-semibold">Chewei</span>
          </div>
          <ThemeToggle className="absolute right-6 top-7" />

          <div className="my-auto w-full py-14 sm:py-16 lg:py-8">
            <div className="mx-auto w-full max-w-[430px]">
              <header className="mb-9">
                <p className="mb-3 text-[12px] font-semibold text-[var(--accent)]">
                  管理员工作台
                </p>
                <h1 className="text-[28px] font-semibold leading-tight text-[var(--foreground)]">
                  欢迎回来
                </h1>
                <p className="mt-3 text-[14px] leading-6 text-[var(--muted-foreground)]">
                  登录后继续管理合租车位与续费信息
                </p>
              </header>
              <LoginForm />
            </div>
          </div>

          <footer className="mx-auto flex min-h-11 w-full max-w-[430px] flex-wrap items-center justify-center gap-3 border-t border-[var(--border)] pt-5 text-[12px] text-[#7b8493]">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} />
              账号信息通过加密会话保护
            </span>
            <InstallAppButton showLabel />
          </footer>
        </div>
      </section>
    </main>
  );
}
