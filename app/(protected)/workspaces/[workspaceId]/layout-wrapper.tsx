import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { WorkspaceLayoutClient } from "./layout-client"
import { USER_STATUS_CONFIG } from "@/constants/user-status"

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

  // Fetch profiles for workspace members
  const { data: memberProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url")
    .in(
      "id",
      (workspaceMembers || []).map((member) => member.user_id)
    )

  // Transform the data to match our interface
  const transformedUsers = (memberProfiles || []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
  }))

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
        status: USER_STATUS_CONFIG.online.type, // Use constant for online status
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    ),
  ])

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
