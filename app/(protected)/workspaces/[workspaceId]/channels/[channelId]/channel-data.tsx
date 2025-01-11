import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export async function getChannelData(workspaceId: string, channelId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Check workspace membership
  const { data: workspaceMember, error: workspaceMemberError } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single()

  if (workspaceMemberError || !workspaceMember) {
    redirect("/")
  }

  // Fetch channel details
  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single()

  if (channelError || !channel) {
    redirect(`/workspaces/${workspaceId}`)
  }

  // Verify channel belongs to workspace
  if (channel.workspace_id !== workspaceId) {
    redirect(`/workspaces/${workspaceId}`)
  }

  // Fetch messages for the channel
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select(
      `
      *,
      profile:user_id (
        id,
        email,
        display_name,
        avatar_url
      ),
      reactions (
        id,
        emoji,
        user_id
      )
    `
    )
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })

  return {
    channel,
    messages: messages || [],
  }
}
