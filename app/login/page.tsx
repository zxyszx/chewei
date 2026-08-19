import { ParkingCircle, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return <main className="grid min-h-dvh place-items-center bg-[#eef1f5] px-4 py-8">
    <section className="min-h-[min(720px,calc(100dvh-32px))] w-full max-w-[560px] border border-[var(--border)] bg-white px-6 py-10 shadow-[0_18px_60px_rgb(18_27_45/8%)] sm:rounded-[8px] sm:px-12">
      <div className="flex h-full min-h-[600px] flex-col">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-5 grid size-16 place-items-center rounded-[14px] bg-[#2563eb] text-white shadow-[0_8px_24px_rgb(37_99_235/22%)]"><ParkingCircle size={34} strokeWidth={1.8} /></div>
            <p className="mb-2 text-[11px] font-bold text-[#2563eb]">PARKING DESK</p>
            <h1 className="text-[28px] font-semibold leading-tight">登录车位管理系统</h1>
            <p className="mt-3 text-[14px] leading-6 text-[var(--muted-foreground)]">管理车位、车友、续费与到期提醒</p>
          </div>
          <LoginForm />
        </div>
        <div className="mt-10 flex items-center justify-center gap-2 border-t border-[var(--border)] pt-5 text-[12px] text-[#7b8493]"><ShieldCheck size={15} />账号信息通过加密会话保护</div>
      </div>
    </section>
  </main>;
}
