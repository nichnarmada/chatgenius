import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with theme switcher */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      {/* Main content */}
      {children}
    </div>
  )
}
