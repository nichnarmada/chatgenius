import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { name, image_url } = await request.json()

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a workspace owner
    const { data: memberRole } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", params.workspaceId)
      .eq("user_id", session.user.id)
      .single()

    if (!memberRole || memberRole.role !== "owner") {
      return NextResponse.json(
        { error: "Only workspace owners can update workspace settings" },
        { status: 403 }
      )
    }

    // Update the workspace
    const { error } = await supabase
      .from("workspaces")
      .update({
        name: name.trim(),
        image_url,
      })
      .eq("id", params.workspaceId)

    if (error) {
      console.error("Error updating workspace:", error)
      return NextResponse.json(
        { error: "Failed to update workspace" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PATCH /api/workspaces/[workspaceId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
