import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const workspaceId = request.nextUrl.pathname.split("/")[3]

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is owner
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()

    if (membershipError) {
      return NextResponse.json(
        { error: "Failed to check membership" },
        { status: 500 }
      )
    }

    if (membership.role === "owner") {
      return NextResponse.json(
        {
          error:
            "You cannot leave this workspace because you are the owner. Transfer ownership to another member first.",
        },
        { status: 403 }
      )
    }

    // Remove user from workspace
    const { error: leaveError } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)

    if (leaveError) {
      return NextResponse.json(
        { error: "Failed to leave workspace" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error leaving workspace:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
