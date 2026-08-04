"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle colour theme"
      className="grid h-10 w-10 place-items-center rounded-full border border-slate/30 text-midnight dark:text-fog hover:bg-slate/10 transition"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
