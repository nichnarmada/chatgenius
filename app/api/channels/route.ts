import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get("name")?.toString()
    const workspaceId = formData.get("workspaceId")?.toString()

    if (!name) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      )
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError)
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create channel
    const { data: channel, error: insertError } = await supabase
      .from("channels")
      .insert([
        {
          name,
          workspace_id: workspaceId,
          created_by_user_id: session.user.id,
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Channel creation error:", insertError)
      return NextResponse.json(
        { error: "Error creating channel: " + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
