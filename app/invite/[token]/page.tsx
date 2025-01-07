import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

export default async function InvitePage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = await createClient()

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get invite details
  const { data: invite, error: inviteError } = await supabase
    .from("workspace_invites")
    .select("*, workspaces(name)")
    .eq("token", params.token)
    .is("accepted_at", null)
    .single()

  if (inviteError || !invite) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Invalid or Expired Invite</h1>
        <p className="text-muted-foreground mb-4">
          This invite link is no longer valid. Please request a new invitation.
        </p>
        <Button asChild>
          <a href="/login">Go to Login</a>
        </Button>
      </div>
    )
  }

  // If user is logged in
  if (session) {
    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (profile) {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", invite.workspace_id)
        .eq("user_id", profile.id)
        .single()

      if (existingMember) {
        // Redirect to workspace if already a member
        redirect(`/workspaces/${invite.workspace_id}`)
      }

      // Add user to workspace
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert([
          {
            workspace_id: invite.workspace_id,
            user_id: profile.id,
            role: invite.role,
          },
        ])

      if (memberError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-2xl font-bold mb-4">Error Joining Workspace</h1>
            <p className="text-muted-foreground">
              There was an error joining the workspace. Please try again.
            </p>
          </div>
        )
      }

      // Mark invite as accepted
      await supabase
        .from("workspace_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id)

      // Redirect to workspace
      redirect(`/workspaces/${invite.workspace_id}`)
    }
  }

  // For non-logged in users, redirect to signup with pre-filled email
  redirect(`/signup?email=${invite.email}&invite=${params.token}`)
}
