import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "车位管理系统", template: "%s · 车位管理系统" },
  description: "流媒体合租车位、成员席位和续费管理后台",
  applicationName: "车位管理系统",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "车位管理" },
  icons: { icon: "/icons/app-icon-192.png", apple: "/icons/app-icon-192.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        {children}
        <Script id="parking-theme" strategy="beforeInteractive">{`(function(){try{var p=localStorage.getItem('parking-theme')||'system';var t=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='light'}})()`}</Script>
        <ServiceWorkerRegistration />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
