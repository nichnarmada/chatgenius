import { createServerClient } from "@supabase/ssr"
import { NextResponse, NextRequest } from "next/server"

export async function PATCH(request: NextRequest) {
  try {
    const { name, image_url } = await request.json()
    const workspaceId = request.nextUrl.pathname.split("/")[3]

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      )
    }

    const response = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
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
      .eq("workspace_id", workspaceId)
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
      .eq("id", workspaceId)

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
