"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

export type ThemePreference = "light" | "dark" | "system";

const storageKey = "chewei-theme-v2";
const changeEvent = "chewei-theme-change";
const options = [
  { value: "light" as const, label: "浅色", icon: Sun },
  { value: "dark" as const, label: "深色", icon: Moon },
  { value: "system" as const, label: "跟随系统", icon: Laptop },
];

function applyTheme(preference: ThemePreference) {
  const resolved = preference === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

function storedTheme(): ThemePreference {
  const saved = window.localStorage.getItem(storageKey);
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "light";
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
  return <div className="space-y-1" role="radiogroup" aria-label="界面主题">
    {options.map(({ value, label, icon: Icon }) => <button key={value} type="button" role="radio" aria-checked={preference === value} onClick={() => update(value)} className={cn("menu-item w-full", preference === value && "menu-item-active")}>
      <Icon size={15} /><span className="flex-1 text-left">{label}</span>{preference === value && <Check size={14} />}
    </button>)}
  </div>;
}
