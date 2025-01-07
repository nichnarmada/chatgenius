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

  // Fetch channel details
  const { data: channel } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single()

  if (!channel) {
    redirect(`/workspaces/${workspaceId}`)
  }

  // Fetch messages for the channel
  const { data: messages } = await supabase
    .from("messages")
    .select(
      `
      *,
      profile:user_id (
        id,
        email,
        display_name
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
