import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export async function getDMData(workspaceId: string, userId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user: currentUser },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !currentUser) {
    redirect("/login")
  }

  // Get other user's profile
  const { data: otherUser } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (!otherUser) {
    redirect("/workspaces")
  }

  // Get workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    redirect("/workspaces")
  }

  // Get DM messages between the two users in this workspace
  const { data: messages } = await supabase
    .from("direct_messages")
    .select(
      `
      *,
      sender:sender_id (
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
    .eq("workspace_id", workspaceId)
    .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: true })

  return {
    otherUser,
    messages: messages || [],
    workspace,
  }
}
