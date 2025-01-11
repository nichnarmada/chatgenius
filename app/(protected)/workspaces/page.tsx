import { createClient } from "@/utils/supabase/server"
import { WorkspacesList } from "./workspaces-list"
import { redirect } from "next/navigation"
import { UserWorkspace } from "@/types/workspace"

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Get user profile with avatar_url
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

  // Get workspaces the user is a member of
  const { data: userWorkspaces, error: userWorkspacesError } = (await supabase
    .from("workspace_members")
    .select(
      `
      workspace:workspaces (
        id,
        name,
        image_url,
        channels (
          id,
          name
        ),
        workspace_members (
          user_id,
          role
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })) as {
    data: UserWorkspace[] | null
    error: any
  }

  // Get workspaces the user is not a member of (discoverable workspaces)
  const { data: memberWorkspaceIds } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)

  const memberIds = memberWorkspaceIds?.map((row) => row.workspace_id) || []

  // Only query for discoverable workspaces if there are existing memberships
  const { data: discoverWorkspaces, error: discoverWorkspacesError } =
    memberIds.length > 0
      ? await supabase
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
          .not("id", "in", `(${memberIds.join(",")})`)
          .order("created_at", { ascending: false })
      : await supabase
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
          .order("created_at", { ascending: false })

  // Transform userWorkspaces data to match expected format
  const transformedUserWorkspaces =
    userWorkspaces?.map((item: UserWorkspace) => ({
      id: item.workspace.id,
      name: item.workspace.name,
      image_url: item.workspace.image_url,
      workspace_members: item.workspace.workspace_members,
      channels: item.workspace.channels,
    })) || []

  return (
    <WorkspacesList
      initialWorkspaces={transformedUserWorkspaces || []}
      discoverableWorkspaces={discoverWorkspaces || []}
      userId={user.id}
      user={user}
      profile={profile}
      error={userWorkspacesError?.message || discoverWorkspacesError?.message}
      success={params.success as string}
    />
  )
}
