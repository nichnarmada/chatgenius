import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { WorkspacesList } from "./workspaces-list"

export default async function WorkspacesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Get all workspaces
  const { data: allWorkspaces, error: workspacesError } = await supabase
    .from("workspaces")
    .select(
      `
      *,
      workspace_members (
        user_id,
        role
      ),
      channels!channels_workspace_id_fkey (
        id,
        name
      )
    `
    )
    .order("created_at", { ascending: false })

  if (workspacesError) {
    console.error("Error fetching workspaces:", workspacesError)
  }

  return (
    <WorkspacesList initialWorkspaces={allWorkspaces || []} userId={user.id} />
  )
}
