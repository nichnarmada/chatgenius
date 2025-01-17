import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { AvatarChatListItem } from "@/types/avatar"

export async function getAvatarChats(workspaceId: string) {
  const supabase = await createClient()

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
      created_by_user_id,
      workspace_id,
      source_type,
      source_id,
      created_at,
      updated_at,
      config:avatar_configs!inner (
        id,
        name,
        system_prompt,
        source_type,
        source_id,
        message_history_limit
      ),
      messages:avatar_chat_messages (
        query,
        response,
        created_at
      )
    `
    )
    .eq("created_by_user_id", user.id)
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
      name: chat.title,
      last_message_at: chat.messages?.[0]?.created_at || chat.updated_at,
      preview: chat.messages?.[0]
        ? `Q: ${chat.messages[0].query}\nA: ${chat.messages[0].response}`
        : "No messages yet",
    })
  )
}
