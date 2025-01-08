import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get invite details
    const { data: invite, error: inviteError } = await supabase
      .from("workspace_invites")
      .select(
        `
        *,
        workspaces:workspace_id (
          name
        )
      `
      )
      .eq("token", token)
      .single()

    if (inviteError) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      )
    }

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    // Check if invite is expired
    const expiresAt = new Date(invite.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 })
    }

    // Check if invite has been accepted
    if (invite.accepted_at) {
      return NextResponse.json(
        { error: "Invite has already been accepted" },
        { status: 410 }
      )
    }

    return NextResponse.json({
      workspace_id: invite.workspace_id,
      name: invite.workspaces?.name || "Unknown Workspace",
      email: invite.email,
      active: true,
    })
  } catch (error) {
    console.error("Error in invite lookup:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
