import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { OpenAI } from "openai"
import { AvatarChat, ChatRequest, ChatResponse } from "@/types/avatar"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, chatId } = (await request.json()) as ChatRequest

    if (!message || !chatId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Fetch chat and its config
    const { data: chat, error: chatError } = await supabase
      .from("avatar_chats")
      .select(
        `
        *,
        config:avatar_configs!inner (
          id,
          name,
          system_prompt,
          message_history_limit
        )
      `
      )
      .eq("id", chatId)
      .single()

    if (chatError || !chat) {
      console.error("Error fetching chat:", chatError)
      return NextResponse.json(
        { error: "Failed to fetch chat" },
        { status: 500 }
      )
    }

    // Generate embedding for user message
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
        avatar_config_id: chat.config.id,
        match_threshold: 0.7,
        match_count: 5,
      }
    )

    if (searchError) {
      console.error("Error searching embeddings:", searchError)
    }

    // Format context from similar content
    const context = similarContent
      ? `Here are some relevant previous messages:\n${similarContent
          .map((item) => `Q: ${item.query}\nA: ${item.response}`)
          .join("\n\n")}`
      : ""

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system" as const,
          content: chat.config.system_prompt,
        },
        {
          role: "system" as const,
          content: context,
        },
        {
          role: "user" as const,
          content: message,
        },
      ].filter((msg) => msg.content), // Remove empty messages
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
      })

    if (messageError) {
      console.error("Error storing message:", messageError)
      return NextResponse.json(
        { error: "Failed to store message" },
        { status: 500 }
      )
    }

    // Create embedding for the response
    const responseEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: response,
      encoding_format: "float",
    })

    // Store the response embedding
    const { error: embeddingError } = await supabase.rpc(
      "manage_avatar_embedding",
      {
        p_content: response,
        p_source_type: chat.source_type,
        p_source_id: chat.source_id,
        p_avatar_config_id: chat.config.id,
        p_workspace_id: chat.workspace_id,
      }
    )

    if (embeddingError) {
      console.error("Error storing response embedding:", embeddingError)
    }

    // Update chat's updated_at timestamp
    const { error: updateError } = await supabase
      .from("avatar_chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId)

    if (updateError) {
      console.error("Error updating chat:", updateError)
    }

    return NextResponse.json({ response } satisfies ChatResponse)
  } catch (error) {
    console.error("Error in chat endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
