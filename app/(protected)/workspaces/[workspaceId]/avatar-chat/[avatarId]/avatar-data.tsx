import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function getAvatarData(workspaceId: string, avatarId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // This is a read-only operation in a Server Component
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch avatar config
  const { data: avatarConfig, error: avatarError } = await supabase
    .from("avatar_configs")
    .select("*")
    .eq("id", avatarId)
    .single()

  if (avatarError || !avatarConfig) {
    redirect(`/workspaces/${workspaceId}`)
  }

  // Verify avatar belongs to workspace
  if (avatarConfig.workspace_id !== workspaceId) {
    redirect(`/workspaces/${workspaceId}`)
  }

  // Fetch recent chat messages
  const { data: messages } = await supabase
    .from("avatar_chats")
    .select("*")
    .eq("avatar_id", avatarId)
    .order("created_at", { ascending: false })
    .limit(50)

  return {
    avatarConfig,
    messages: messages?.reverse() || [],
  }
}
