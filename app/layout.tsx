import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Chewei", template: "%s · Chewei" },
  description: "流媒体合租车位、成员席位和续费管理后台",
  applicationName: "Chewei",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Chewei" },
  icons: { icon: "/icons/app-icon-192.png", apple: "/icons/app-icon-192.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        {children}
        <Script id="chewei-theme" strategy="beforeInteractive">{`(function(){try{var p=localStorage.getItem('chewei-theme-v2')||'light';var t=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='light'}})()`}</Script>
        <ServiceWorkerRegistration />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
