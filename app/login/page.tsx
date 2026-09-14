import { ParkingCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-switcher";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "登录" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="login-page min-h-dvh">
      <div className="login-floating-tools">
        <ThemeToggle className="login-theme-toggle" />
      </div>

      <section className="login-stage" aria-labelledby="login-title">
        <div className="login-shell">
          <header className="login-card-header">
            <div className="login-title-row">
              <span className="login-logo"><ParkingCircle size={25} strokeWidth={1.9} /></span>
              <h1 id="login-title">登录车位管理系统</h1>
            </div>
            <span className="login-edition">车位管理 · 订阅运营工作台</span>
          </header>

          <div className="login-form-panel">
            <div className="login-form-card">
              <LoginForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
