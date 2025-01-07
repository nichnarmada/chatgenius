import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { email, workspaceId } = await req.json()

    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: "Email and workspace ID are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the current user's profile
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get workspace details
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      )
    }

    // Check if the invited email is already a member
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .eq(
        "user_id",
        (
          await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single()
        )?.data?.id
      )
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this workspace" },
        { status: 400 }
      )
    }

    // Check if there's already a pending invite
    const { data: existingInvite } = await supabase
      .from("workspace_invites")
      .select()
      .eq("workspace_id", workspaceId)
      .eq("email", email)
      .is("accepted_at", null)
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite is already pending for this email" },
        { status: 400 }
      )
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from("workspace_invites")
      .insert([
        {
          workspace_id: workspaceId,
          email: email,
          invited_by: profile.id,
          role: "member",
        },
      ])
      .select()
      .single()

    if (inviteError) {
      console.error("Error creating invite record:", inviteError)
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      )
    }

    // Send invite email using Supabase
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${invite.token}`,
        data: {
          workspace_id: workspaceId,
          workspace_name: workspace.name,
          invited_by: profile.email,
        },
      }
    )

    if (emailError) {
      console.error("Error sending invite email:", emailError)
      // Delete the invite since email failed
      await supabase.from("workspace_invites").delete().eq("id", invite.id)

      return NextResponse.json(
        { error: "Failed to send invite email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, invite })
  } catch (error) {
    console.error("Error in invite endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
