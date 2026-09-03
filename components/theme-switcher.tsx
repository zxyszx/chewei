"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

export type ThemePreference = "light" | "dark" | "system";

const storageKey = "chewei-theme-v2";
const changeEvent = "chewei-theme-change";
function applyTheme(preference: ThemePreference) {
  const resolved = preference === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

function storedTheme(): ThemePreference {
  const saved = window.localStorage.getItem(storageKey);
  return saved === "dark" ? "dark" : "light";
}

export function useThemePreference() {
  const preference = useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      window.addEventListener("storage", notify);
      window.addEventListener(changeEvent, notify);
      media.addEventListener("change", notify);
      return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener(changeEvent, notify);
        media.removeEventListener("change", notify);
      };
    },
    storedTheme,
    (): ThemePreference => "light",
  );

  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  const update = (value: ThemePreference) => {
    window.localStorage.setItem(storageKey, value);
    applyTheme(value);
    window.dispatchEvent(new Event(changeEvent));
  };

  return { preference, update };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { preference, update } = useThemePreference();
  const next = preference === "dark" ? "light" : "dark";
  return <button type="button" className={cn("btn icon-btn", className)} onClick={() => update(next)} aria-label={preference === "dark" ? "切换到浅色模式" : "切换到深色模式"} title={preference === "dark" ? "浅色模式" : "深色模式"}>
    <Sun size={17} className="theme-icon-light" />
    <Moon size={17} className="theme-icon-dark" />
  </button>;
}

export function ThemePicker() {
  const { preference, update } = useThemePreference();
  const selected = preference === "dark" ? "dark" : "light";
  return <div className="theme-picker-icons" role="radiogroup" aria-label="界面主题">
    <button type="button" role="radio" aria-checked={selected === "light"} onClick={() => update("light")} className={cn("theme-picker-button", selected === "light" && "theme-picker-button-active")} aria-label="浅色模式" title="浅色模式"><Sun size={17} /></button>
    <button type="button" role="radio" aria-checked={selected === "dark"} onClick={() => update("dark")} className={cn("theme-picker-button", selected === "dark" && "theme-picker-button-active")} aria-label="深色模式" title="深色模式"><Moon size={17} /></button>
  </div>;
}
