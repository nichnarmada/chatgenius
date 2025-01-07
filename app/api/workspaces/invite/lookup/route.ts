import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get invite details including email
    const { data: invite, error } = await supabase
      .from("workspace_invites")
      .select(
        `
        workspace_id,
        email,
        created_at,
        active,
        workspaces (
          name
        )
      `
      )
      .eq("token", token)
      .single()

    if (error) {
      console.error("Error looking up invite:", error)
      return NextResponse.json(
        { error: "Failed to lookup invite" },
        { status: 500 }
      )
    }

    if (!invite || !invite.active) {
      return NextResponse.json(
        { error: "Invite not found or expired" },
        { status: 404 }
      )
    }

    // Check if invite is expired (24 hours)
    const created = new Date(invite.created_at)
    const now = new Date()
    const isExpired = now.getTime() - created.getTime() > 24 * 60 * 60 * 1000

    if (isExpired) {
      // Update invite to inactive
      await supabase
        .from("workspace_invites")
        .update({ active: false })
        .eq("token", token)

      return NextResponse.json({ error: "Invite has expired" }, { status: 400 })
    }

    return NextResponse.json({
      workspace_id: invite.workspace_id,
      name: invite.workspaces?.name || "Unknown Workspace",
      email: invite.email,
      active: true,
    })
  } catch (error) {
    console.error("Error in lookup invite API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
