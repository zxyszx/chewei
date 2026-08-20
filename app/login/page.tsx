import { CheckCircle2, ParkingCircle, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return <main className="flex min-h-dvh items-stretch bg-white lg:items-center lg:bg-[#f2f5f4] lg:p-8">
    <section className="mx-auto grid min-h-dvh w-full overflow-hidden bg-white lg:min-h-[680px] lg:max-w-[1120px] lg:grid-cols-[0.9fr_1.1fr] lg:rounded-[8px] lg:border lg:border-[var(--border)] lg:shadow-[0_24px_70px_rgb(15_23_42/10%)]">
      <aside className="relative hidden overflow-hidden bg-[#173b46] px-12 py-12 text-white lg:flex lg:flex-col" aria-label="车位管理系统">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-[8px] bg-white text-[#1d5f6a]"><ParkingCircle size={27} strokeWidth={1.9} /></span>
          <div>
            <p className="text-[18px] font-semibold leading-6">车位管理系统</p>
            <p className="mt-0.5 text-[12px] text-[#b9d0d2]">PARKING DESK</p>
          </div>
        </div>

        <div className="my-auto py-16">
          <div className="mb-10 flex items-center gap-3 text-[#b9d0d2]">
            <span className="h-px w-12 bg-[#6f9298]" />
            <span className="text-[12px] font-medium">内部管理工作台</span>
          </div>
          <p className="max-w-[350px] text-[30px] font-semibold leading-[1.35]">让每个共享车位的状态清晰可见</p>
          <div className="mt-12 space-y-5" aria-hidden="true">
            {[5, 4, 3].map((filled, row) => <div key={filled} className="flex items-center gap-4">
              <span className="w-16 text-[12px] tabular-nums text-[#b9d0d2]">0{row + 1}</span>
              <div className="flex gap-3">
                {Array.from({ length: 5 }, (_, index) => <span key={index} className={`size-3 rounded-full border ${index < filled ? "border-[#6ee7b7] bg-[#6ee7b7]" : "border-[#6f9298] bg-transparent"}`} />)}
              </div>
            </div>)}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-white/15 pt-6 text-[13px] text-[#d4e4e5]"><CheckCircle2 size={16} className="text-[#6ee7b7]" />系统服务正常</div>
      </aside>

      <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-12 lg:min-h-0 lg:px-16 lg:py-12">
        <div className="flex items-center gap-3 lg:hidden">
          <span className="grid size-10 place-items-center rounded-[8px] bg-[#2563eb] text-white"><ParkingCircle size={25} strokeWidth={1.9} /></span>
          <span className="text-[17px] font-semibold">车位管理系统</span>
        </div>

        <div className="my-auto w-full py-14 sm:py-16 lg:py-8">
          <div className="mx-auto w-full max-w-[430px]">
            <header className="mb-9">
              <p className="mb-3 text-[12px] font-semibold text-[#2563eb]">管理员工作台</p>
              <h1 className="text-[28px] font-semibold leading-tight text-[var(--foreground)]">欢迎回来</h1>
              <p className="mt-3 text-[14px] leading-6 text-[var(--muted-foreground)]">登录后继续管理车位与续费信息</p>
            </header>
            <LoginForm />
          </div>
        </div>

        <footer className="mx-auto flex min-h-11 w-full max-w-[430px] items-center justify-center gap-2 border-t border-[var(--border)] pt-5 text-[12px] text-[#7b8493]"><ShieldCheck size={15} />账号信息通过加密会话保护</footer>
      </div>
    </section>
  </main>;
}
