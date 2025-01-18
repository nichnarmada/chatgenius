import { createClient } from "@/utils/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import OpenAI from "openai"
import type { ChatRequest, ChatResponse, AvatarChat } from "@/types/avatar"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      )
    }

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify workspace membership
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

    // Get all chats for this workspace
    const { data: chats, error: chatsError } = await supabase
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
          embedding_settings
        ),
        messages:avatar_chat_messages (
          created_at,
          query,
          response
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (chatsError) {
      console.error("Error fetching chats:", chatsError)
      return NextResponse.json(
        { error: "Failed to fetch chats" },
        { status: 500 }
      )
    }

    // Format chats for the list view
    const chatList = chats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      last_message_at: chat.messages?.[0]?.created_at || chat.created_at,
      preview: chat.messages?.[0]?.query || "No messages yet",
    }))

    return NextResponse.json({ chats: chatList })
  } catch (error) {
    console.error("Error in GET /api/avatars/chat:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { chatId, message }: ChatRequest = await request.json()

    if (!message || !chatId) {
      return NextResponse.json(
        { error: "Message and chat ID are required" },
        { status: 400 }
      )
    }

    // Get the chat and its config
    const { data: chat, error: chatError } = await supabase
      .from("avatar_chats")
      .select(
        `
        id,
        title,
        config_id,
        source_type,
        source_id,
        workspace_id,
        config:avatar_configs!inner (
          id,
          system_prompt,
          embedding_settings
        )
      `
      )
      .eq("id", chatId)
      .single<AvatarChat>()

    if (chatError || !chat?.config) {
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

    // Create embedding for the query
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
      encoding_format: "float",
    })

    // Search for similar content
    const { data: similarContent, error: searchError } = await supabase.rpc(
      "search_avatar_embeddings",
      {
        query_embedding: embedding.data[0].embedding,
        avatar_config_id: chat.config_id,
        match_threshold: chat.config.embedding_settings.similarity_threshold,
        match_count: chat.config.embedding_settings.max_context_messages,
      }
    )

    if (searchError) {
      console.error("Error searching embeddings:", searchError)
    }

    // Format context from similar content
    const context = similarContent
      ? `Here are some relevant previous messages:\n${similarContent
          .map((item: { content: string }) => item.content)
          .join("\n")}`
      : ""

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: chat.config.system_prompt,
        },
        {
          role: "system",
          content: context,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
    })

    const response = completion.choices[0].message.content

    if (!response) {
      throw new Error("No response generated")
    }

    // Store the message pair
    const { error: messageError } = await supabase
      .from("avatar_chat_messages")
      .insert({
        chat_id: chatId,
        query: message,
        response: response,
        sender_id: user.id,
      })

    if (messageError) {
      console.error("Error storing message:", messageError)
      return NextResponse.json(
        { error: "Failed to store message" },
        { status: 500 }
      )
    }

    const chatResponse: ChatResponse = { response }
    return NextResponse.json(chatResponse)
  } catch (error) {
    console.error("Error in chat endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
