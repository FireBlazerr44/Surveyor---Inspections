"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-10 h-10" />
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
      type="button"
    >
      {isDark ? (
        <Moon className="w-5 h-5 text-secondary" />
      ) : (
        <Sun className="w-5 h-5 text-primary" />
      )}
    </button>
  )
}