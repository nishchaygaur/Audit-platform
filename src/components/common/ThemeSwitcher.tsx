"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme, type Theme } from "@/context/ThemeContext";

interface ThemeSwitcherProps {
  variant?: "button" | "segmented" | "menu-item" | "dropdown";
  className?: string;
  showLabel?: boolean;
}

export default function ThemeSwitcher({
  variant = "button",
  className = "",
  showLabel = false,
}: ThemeSwitcherProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    // After mounting, we can safely render dynamic attributes without hydration mismatch
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true; // Default to dark before mount

  // 1. Icon Toggle Button (Ideal for Header bar & quick actions)
  if (variant === "button") {
    return (
      <button
        type="button"
        id="theme-switcher-button"
        data-testid="theme-switcher-button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 focus:outline-hidden ${className}`}
      >
        <span className="sr-only">Toggle theme</span>
        {isDark ? (
          <Sun className="h-[18px] w-[18px] text-amber-400 transition-transform duration-200 hover:rotate-45" />
        ) : (
          <Moon className="h-[18px] w-[18px] text-slate-600 transition-transform duration-200 hover:-rotate-12" />
        )}
      </button>
    );
  }

  // 2. Segmented Pill Control (Ideal for Settings / Appearance page)
  if (variant === "segmented") {
    const options: { id: Theme; label: string; icon: typeof Sun }[] = [
      { id: "dark", label: "Dark", icon: Moon },
      { id: "light", label: "Light", icon: Sun },
      { id: "system", label: "System", icon: Monitor },
    ];

    return (
      <div
        className={`inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/80 ${className}`}
        role="radiogroup"
        aria-label="Theme selection"
      >
        {options.map(({ id, label, icon: Icon }) => {
          const active = mounted && theme === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  active && id === "dark"
                    ? "text-blue-400"
                    : active && id === "light"
                    ? "text-amber-500"
                    : ""
                }`}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 3. Menu Item (Ideal for Sidebar user menu / popovers)
  if (variant === "menu-item") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex h-8 w-full items-center justify-between rounded-md px-2.5 text-[12px] text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          {isDark ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          )}
          <span>Theme</span>
        </div>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {mounted ? (isDark ? "Dark" : "Light") : "Dark"}
        </span>
      </button>
    );
  }

  // 4. Dropdown Variant
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleTheme}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-blue-400" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
        {showLabel && <span>{isDark ? "Dark Theme" : "Light Theme"}</span>}
      </button>
    </div>
  );
}
