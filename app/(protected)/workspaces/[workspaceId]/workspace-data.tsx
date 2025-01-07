import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export async function getWorkspaceData(workspaceId: string) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Fetch workspace details
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    redirect("/workspaces")
  }

  // Fetch channels for the workspace
  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)

  return {
    user,
    workspace,
    channels,
  }
}
