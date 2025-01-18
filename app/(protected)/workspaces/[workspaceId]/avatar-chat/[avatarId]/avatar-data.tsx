import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AvatarChat, AvatarConfig } from "@/types/avatar"

export async function getAvatarData(workspaceId: string, chatId: string) {
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

  // Fetch chat with its config and messages
  const { data: chatData, error: chatError } = await supabase
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
        source_type,
        source_id,
        created_by_user_id,
        workspace_id,
        created_at,
        updated_at,
        embedding_settings
      ),
      messages:avatar_chat_messages (
        id,
        chat_id,
        query,
        response,
        created_at,
        sender:profiles!sender_id (
          id,
          email,
          display_name,
          avatar_url
        )
      )
    `
    )
    .eq("id", chatId)
    .order("created_at", { foreignTable: "messages", ascending: false })
    .single()

  if (chatError) {
    console.error("Error fetching chat:", chatError)
    redirect(`/workspaces/${workspaceId}/avatar-chat`)
  }

  if (!chatData || !chatData.config) {
    redirect(`/workspaces/${workspaceId}/avatar-chat`)
  }

  const config = chatData.config as unknown as AvatarConfig
  if (config.workspace_id !== workspaceId) {
    redirect(`/workspaces/${workspaceId}/avatar-chat`)
  }

  const chat: AvatarChat = {
    id: chatData.id,
    title: chatData.title,
    config_id: chatData.config_id,
    source_type: chatData.source_type,
    source_id: chatData.source_id,
    created_by_user_id: chatData.created_by_user_id,
    workspace_id: chatData.workspace_id,
    created_at: chatData.created_at,
    updated_at: chatData.updated_at,
    config,
    messages: chatData.messages || [],
  }

  return chat
}
