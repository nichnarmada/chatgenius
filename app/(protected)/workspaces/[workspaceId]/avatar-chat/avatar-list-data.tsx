import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AvatarChatListItem } from "@/types/avatar"

export async function getAvatarChats(workspaceId: string) {
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
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("Error fetching user:", userError)
    redirect("/login")
  }

  if (!user) {
    redirect("/login")
  }

  // Fetch avatar chats with their configs and latest messages
  const { data: chats, error: chatsError } = await supabase
    .from("avatar_chats")
    .select(
      `
      id,
      title,
      config_id,
      source_type,
      source_id,
      created_by_user_id,
      workspace_id,
      created_at,
      updated_at,
      config:avatar_configs!inner (
        id,
        name,
        system_prompt,
        embedding_settings
      ),
      messages:avatar_chat_messages (
        query,
        response,
        created_at
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(1, { foreignTable: "messages" })

  if (chatsError) {
    console.error("Error fetching chats:", chatsError)
    return []
  }

  // Format the data for the UI
  return (chats || []).map(
    (chat): AvatarChatListItem => ({
      id: chat.id,
      title: chat.title,
      last_message_at: chat.messages?.[0]?.created_at || chat.updated_at,
      preview: chat.messages?.[0]?.query || "No messages yet",
    })
  )
}
