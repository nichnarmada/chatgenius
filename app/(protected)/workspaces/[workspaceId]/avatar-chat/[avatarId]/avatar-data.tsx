import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { AvatarChat, AvatarConfig } from "@/types/avatar"

export async function getAvatarData(workspaceId: string, chatId: string) {
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

  // Fetch chat with its config and messages
  const { data: chatData, error: chatError } = await supabase
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
        created_by_user_id,
        workspace_id,
        created_at,
        updated_at,
        message_history_limit
      ),
      messages:avatar_chat_messages (
        id,
        chat_id,
        query,
        response,
        created_at
      )
    `
    )
    .eq("id", chatId)
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
    ...chatData,
    config,
  }

  return chat
}
