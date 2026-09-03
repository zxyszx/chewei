import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chewei",
    short_name: "Chewei",
    description: "流媒体合租车位、成员席位和续费管理后台",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f8",
    theme_color: "#242424",
    orientation: "any",
    icons: [
      { src: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/app-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
