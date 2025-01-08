import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect(`/login?error=Please sign in to accept the invitation`)
  }

  const { data: invite, error: inviteError } = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("token", resolvedParams.token)
    .single()

  if (inviteError || !invite) {
    redirect(`/workspaces?error=Invalid or expired invitation link`)
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", invite.workspace_id)
    .eq("user_id", user.id)
    .single()

  if (existingMember) {
    redirect(`/workspaces/${invite.workspace_id}`)
  }

  // Add user to workspace
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: "member",
    })

  if (memberError) {
    redirect(
      `/workspaces?error=Failed to join workspace: ${memberError.message}`
    )
  }

  // Delete the invite
  await supabase
    .from("workspace_invites")
    .delete()
    .eq("token", resolvedParams.token)

  redirect(
    `/workspaces/${invite.workspace_id}?success=Successfully joined workspace`
  )
}
