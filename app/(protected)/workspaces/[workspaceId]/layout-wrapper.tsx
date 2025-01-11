import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { WorkspaceLayoutClient } from "./layout-client"
import { USER_STATUS_CONFIG } from "@/constants/user-status"
import { Profile } from "@/types/profile"
import { Workspace, Channel } from "@/types/workspace"

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
    .select(
      `
      id,
      email,
      display_name,
      avatar_url
    `
    )
    .eq("id", user.id)
    .single()

  const { data: workspace } = await supabase
    .from("workspaces")
    .select(
      `
      id,
      name,
      image_url,
      workspace_members (
        user_id,
        role
      ),
      channels (
        id,
        name
      )
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    redirect("/workspaces")
  }

  const { data: channels } = await supabase
    .from("channels")
    .select(
      `
      id,
      name
    `
    )
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true })

  // Fetch workspace users
  const { data: workspaceMembers } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", workspace.id)

  // Fetch profiles for workspace members
  const { data: memberProfiles } = await supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      display_name,
      avatar_url
    `
    )
    .in(
      "id",
      (workspaceMembers || []).map((member) => member.user_id)
    )

  // Set/update session and status on workspace entry
  await Promise.all([
    supabase.from("user_sessions").upsert(
      {
        user_id: user.id,
        last_seen_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    ),
    supabase.from("user_status").upsert(
      {
        user_id: user.id,
        status: USER_STATUS_CONFIG.online.type,
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    ),
  ])

  return (
    <WorkspaceLayoutClient
      workspace={workspace as Workspace}
      channels={(channels as Channel[]) || []}
      user={user}
      profile={profile as Profile}
      workspaceUsers={(memberProfiles as Profile[]) || []}
    >
      {children}
    </WorkspaceLayoutClient>
  )
}
