"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="flex w-full items-center gap-2"
    >
      {theme === "light" ? (
        <>
          <Moon className="h-4 w-4" />
          Dark mode
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          Light mode
        </>
      )}
    </button>
  )
}
