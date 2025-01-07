import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { name, image } = json

    if (!name) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      )
    }

    // Start a transaction by using a single connection
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert([
        {
          name,
          created_by_user_id: user.id,
          members: [user.id],
          image_url: image,
        },
      ])
      .select()
      .single()

    if (workspaceError) {
      console.error("Workspace creation error:", workspaceError)
      return NextResponse.json(
        { error: "Error creating workspace" },
        { status: 500 }
      )
    }

    // Create default "general" channel
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .insert([
        {
          name: "general",
          workspace_id: workspace.id,
          created_by_user_id: user.id,
          description: "General discussion channel",
        },
      ])
      .select()
      .single()

    if (channelError) {
      console.error("Channel creation error:", channelError)
      // Even if channel creation fails, we'll return the workspace
      return NextResponse.json(workspace)
    }

    return NextResponse.json({
      ...workspace,
      defaultChannelId: channel.id,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
