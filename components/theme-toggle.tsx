"use client"

import { useTheme } from "next-themes"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <AnimatedThemeToggler
      // Before hydration resolvedTheme is undefined; the app defaults to dark.
      theme={resolvedTheme === "light" ? "light" : "dark"}
      onThemeChange={setTheme}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        className
      )}
    />
  )
}
