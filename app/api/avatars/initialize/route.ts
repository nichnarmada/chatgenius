import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

interface Message {
  id: string
  content: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { chatId } = await request.json()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("Not authenticated")

    // Get the avatar chat and its config
    const { data: chat, error: chatError } = await supabase
      .from("avatar_chats")
      .select(
        `
        *,
        config:avatar_configs!inner (
          id,
          message_history_limit
        )
      `
      )
      .eq("id", chatId)
      .single()

    if (chatError) throw chatError

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", chat.workspace_id)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      console.error("Workspace membership error:", membershipError)
      throw new Error("User is not a member of this workspace")
    }

    // Get the message history limit from config
    const messageLimit = chat.config.message_history_limit || 20

    // Get the latest messages based on source type
    let messages: Message[]
    if (chat.source_type === "channel") {
      const { data, error } = await supabase
        .from("messages")
        .select("id, content")
        .eq("channel_id", chat.source_id)
        .order("created_at", { ascending: false })
        .limit(messageLimit)

      if (error) throw error
      messages = data
    } else {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("id, content")
        .or(`sender_id.eq.${chat.source_id},receiver_id.eq.${chat.source_id}`)
        .order("created_at", { ascending: false })
        .limit(messageLimit)

      if (error) throw error
      messages = data
    }

    // Create embeddings for each message
    const insertPromises = messages.map((message: Message) =>
      supabase.rpc("manage_avatar_embedding", {
        p_content: message.content,
        p_source_type: chat.source_type === "channel" ? "channel" : "user",
        p_source_id: message.id,
        p_avatar_config_id: chat.config.id,
        p_workspace_id: chat.workspace_id,
      })
    )

    const results = await Promise.all(insertPromises)
    const insertError = results.find((result) => result.error)?.error

    if (insertError) throw insertError

    return NextResponse.json({ success: true, count: messages.length })
  } catch (error) {
    console.error("Error initializing avatar embeddings:", error)
    return NextResponse.json(
      { error: "Failed to initialize avatar embeddings" },
      { status: 500 }
    )
  }
}
