import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { WorkspaceLayoutClient } from "./layout-client"

interface WorkspaceUser {
  user_id: string
  profiles: {
    id: string
    email: string
    display_name: string
    avatar_url?: string
  }
}

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

  // Fetch workspace users
  const { data: workspaceMembers, error: membersError } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", workspace.id)

  console.log("Workspace ID:", workspace.id)
  console.log("Workspace Members Query Result:", workspaceMembers)
  console.log("Workspace Members Query Error:", membersError)

  // Fetch profiles for workspace members
  const { data: memberProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url")
    .in(
      "id",
      (workspaceMembers || []).map((member) => member.user_id)
    )

  console.log("Member Profiles:", memberProfiles)
  console.log("Profiles Error:", profilesError)

  // Transform the data to match our interface
  const transformedUsers = (memberProfiles || []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
  }))

  return (
    <WorkspaceLayoutClient
      workspace={workspace}
      channels={channels || []}
      user={user}
      profile={profile}
      workspaceUsers={transformedUsers}
    >
      {children}
    </WorkspaceLayoutClient>
  )
}
