import { createClient } from "@/utils/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const chatId = request.nextUrl.pathname.split("/")[4]
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the chat and its messages with pagination
    const { data: chat, error: chatError } = await supabase
      .from("avatar_chats")
      .select(
        `
        id,
        title,
        config_id,
        source_type,
        source_id,
        created_by_user_id,
        workspace_id,
        created_at,
        updated_at,
        config:avatar_configs!inner (
          id,
          name,
          system_prompt,
          source_type,
          source_id,
          created_by_user_id,
          workspace_id,
          created_at,
          updated_at,
          embedding_settings
        ),
        messages:avatar_chat_messages (
          id,
          chat_id,
          query,
          response,
          created_at,
          sender:profiles!sender_id (
            id,
            email,
            display_name,
            avatar_url
          )
        )
      `
      )
      .eq("id", chatId)
      .order("created_at", { foreignTable: "messages", ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)
      .single()

    if (chatError) {
      console.error("Error fetching chat:", chatError)
      return NextResponse.json(
        { error: "Failed to fetch chat" },
        { status: 500 }
      )
    }

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", chat.workspace_id)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a workspace member" },
        { status: 403 }
      )
    }

    // Get total message count for pagination
    const { count: totalMessages, error: countError } = await supabase
      .from("avatar_chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("chat_id", chatId)

    if (countError) {
      console.error("Error counting messages:", countError)
    }

    return NextResponse.json({
      chat,
      pagination: {
        page,
        pageSize,
        totalMessages: totalMessages || 0,
        totalPages: Math.ceil((totalMessages || 0) / pageSize),
      },
    })
  } catch (error) {
    console.error("Error in GET /api/avatars/chat/[chatId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const chatId = request.nextUrl.pathname.split("/")[4]

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the chat to verify ownership and workspace
    const { data: chat, error: chatError } = await supabase
      .from("avatar_chats")
      .select("workspace_id, created_by_user_id")
      .eq("id", chatId)
      .single()

    if (chatError) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", chat.workspace_id)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a workspace member" },
        { status: 403 }
      )
    }

    // Only allow the creator to delete the chat
    if (chat.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: "Only the creator can delete this chat" },
        { status: 403 }
      )
    }

    // Delete the chat (this will cascade to messages and embeddings)
    const { error: deleteError } = await supabase
      .from("avatar_chats")
      .delete()
      .eq("id", chatId)

    if (deleteError) {
      console.error("Error deleting chat:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete chat" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/avatars/chat/[chatId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
