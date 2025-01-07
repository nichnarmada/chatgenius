import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from("workspace_invites")
      .select("*")
      .eq("token", token)
      .eq("email", user.email)
      .is("accepted_at", null)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      )
    }

    // Start a transaction
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .insert([
        {
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: invite.role,
        },
      ])
      .select()
      .single()

    if (memberError) {
      console.error("Error adding member:", memberError)
      return NextResponse.json(
        { error: "Failed to add member to workspace" },
        { status: 500 }
      )
    }

    // Mark invite as accepted
    const { error: updateError } = await supabase
      .from("workspace_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id)

    if (updateError) {
      console.error("Error updating invite:", updateError)
    }

    return NextResponse.json({ success: true, member })
  } catch (error) {
    console.error("Error in accept invite endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
