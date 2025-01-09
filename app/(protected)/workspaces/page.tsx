import { createClient } from "@/utils/supabase/server"
import { WorkspacesList } from "./workspaces-list"
import { redirect } from "next/navigation"

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

  // Get all workspaces with their members and channels
  const { data: workspaces, error: workspacesError } = await supabase
    .from("workspaces")
    .select(
      `
      *,
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

  return (
    <WorkspacesList
      initialWorkspaces={workspaces || []}
      userId={user.id}
      user={user}
      profile={profile}
      error={workspacesError?.message}
      success={params.success as string}
    />
  )
}
