import { ParkingCircle, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return <main className="min-h-dvh bg-[#e7ebe8]">
    <section className="mx-auto min-h-dvh w-full max-w-[560px] bg-white px-6 py-9 sm:border-x sm:border-[var(--border)] sm:px-12">
      <div className="flex min-h-[calc(100dvh-72px)] flex-col">
        <div className="flex-1">
          <header className="flex flex-col items-center gap-2 pb-10 pt-[9vh] text-center">
            <div className="mb-3 grid size-16 place-items-center rounded-[14px] bg-[#2563eb] text-white shadow-[0_8px_24px_rgb(37_99_235/18%)]"><ParkingCircle size={34} strokeWidth={1.8} /></div>
            <h1 className="text-[30px] font-semibold leading-tight">登录车位管理系统</h1>
            <p className="text-[15px] leading-6 text-[var(--muted-foreground)]">管理车位、车友、续费与到期提醒</p>
          </header>
          <LoginForm />
        </div>
        <footer className="mt-12 flex min-h-11 items-center justify-center gap-2 border-t border-[var(--border)] pt-5 text-[12px] text-[#7b8493]"><ShieldCheck size={15} />账号信息通过加密会话保护</footer>
      </div>
    </section>
  </main>;
}
