import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const workspaceId = searchParams.get("workspaceId")
    const type = searchParams.get("type") // 'messages' or 'files'

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      )
    }

    // Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a workspace member" },
        { status: 403 }
      )
    }

    // Get user's accessible channels in the workspace
    const { data: channels } = await supabase
      .from("channels")
      .select("id")
      .eq("workspace_id", workspaceId)

    const channelIds = channels?.map((channel) => channel.id) || []

    let searchResults
    if (type === "files") {
      // Search in files
      const { data: files, error: filesError } = await supabase
        .from("files")
        .select("*")
        .eq("workspace_id", workspaceId)
        .in("channel_id", channelIds)
        .or(`file_name.ilike.%${query}%,` + `file_type.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(20)

      if (filesError) {
        throw filesError
      }
      searchResults = files
    } else {
      // Search in messages using full-text search
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("workspace_id", workspaceId)
        .in("channel_id", channelIds)
        .textSearch("content", query)
        .order("created_at", { ascending: false })
        .limit(20)

      if (messagesError) {
        throw messagesError
      }
      searchResults = messages
    }

    return NextResponse.json({ hits: searchResults })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
