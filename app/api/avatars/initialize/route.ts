import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("Starting initialization process...")
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error("Authentication error:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("User authenticated:", user.id)

    // Get request body
    const { chatId } = await request.json()
    console.log("Received chatId:", chatId)

    // Get the chat and its config
    const { data: chat, error: chatError } = await supabase
      .from("avatar_chats")
      .select(
        `
        *,
        config:avatar_configs!inner (
          id,
          source_type,
          source_id,
          embedding_settings
        )
      `
      )
      .eq("id", chatId)
      .single()

    if (chatError) {
      console.error("Error fetching chat:", chatError)
      return NextResponse.json(
        { error: "Failed to fetch chat" },
        { status: 500 }
      )
    }
    console.log("Retrieved chat:", {
      id: chat.id,
      config_id: chat.config.id,
      source_type: chat.config.source_type,
      source_id: chat.config.source_id,
      settings: chat.config.embedding_settings,
    })

    // Query messages based on source type
    let messages = []
    if (chat.config.source_type === "channel") {
      const { data: channelMessages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("channel_id", chat.config.source_id)
        .order("created_at", { ascending: false })
        .limit(chat.config.embedding_settings.recent_messages_count)

      if (messagesError) {
        console.error("Error fetching channel messages:", messagesError)
      } else {
        messages = channelMessages
        console.log("Retrieved channel messages:", {
          count: messages.length,
          messages: messages.map((m) => ({
            id: m.id,
            content: m.content,
            created_at: m.created_at,
          })),
        })
      }
    } else if (chat.config.source_type === "user") {
      const { data: directMessages, error: messagesError } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `sender_id.eq.${chat.config.source_id},receiver_id.eq.${chat.config.source_id}`
        )
        .order("created_at", { ascending: false })
        .limit(chat.config.embedding_settings.recent_messages_count)

      if (messagesError) {
        console.error("Error fetching direct messages:", messagesError)
      } else {
        messages = directMessages
        console.log("Retrieved direct messages:", {
          count: messages.length,
          messages: messages.map((m) => ({
            id: m.id,
            content: m.content,
            sender_id: m.sender_id,
            receiver_id: m.receiver_id,
            created_at: m.created_at,
          })),
        })
      }
    }

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", chat.workspace_id)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      console.error("Workspace membership error:", membershipError)
      return NextResponse.json(
        { error: "Not a workspace member" },
        { status: 403 }
      )
    }
    console.log("Workspace membership verified")

    // Initialize embeddings
    console.log("Calling initialize_avatar_chat_embeddings with:", {
      p_chat_id: chatId,
      p_message_limit: chat.config.embedding_settings.recent_messages_count,
    })
    const { data: result, error: initError } = await supabase.rpc(
      "initialize_avatar_chat_embeddings",
      {
        p_chat_id: chatId,
        p_message_limit: chat.config.embedding_settings.recent_messages_count,
      }
    )

    if (initError) {
      console.error("Error initializing embeddings:", {
        error: initError,
        code: initError.code,
        details: initError.details,
        hint: initError.hint,
      })
      return NextResponse.json(
        { error: "Failed to initialize embeddings" },
        { status: 500 }
      )
    }

    console.log("Embeddings initialized successfully:", result)
    return NextResponse.json({ success: true, count: result })
  } catch (error) {
    console.error("Unexpected error in initialize endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
