import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { WorkspacesList } from "./workspaces-list"
import { Toaster } from "@/components/ui/toaster"

export default async function WorkspacesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

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

  // Collect all errors
  const error = workspacesError?.message || profileError?.message

  return (
    <>
      <WorkspacesList
        initialWorkspaces={allWorkspaces || []}
        userId={user.id}
        user={user}
        profile={profile}
        error={error}
      />
      <Toaster />
    </>
  )
}
