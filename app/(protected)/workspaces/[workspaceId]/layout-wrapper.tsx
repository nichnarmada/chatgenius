import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { WorkspaceLayoutClient } from "./layout-client"

interface LayoutWrapperProps {
  children: React.ReactNode
  params: { workspaceId: string }
}

export default async function LayoutWrapper({
  children,
  params,
}: LayoutWrapperProps) {
  const supabase = await createClient()
  const { workspaceId } = await Promise.resolve(params)

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Fetch user profile for display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    redirect("/workspaces")
  }

  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true })

  return (
    <WorkspaceLayoutClient
      workspace={workspace}
      channels={channels || []}
      user={user}
      profile={profile}
    >
      {children}
    </WorkspaceLayoutClient>
  )
}
