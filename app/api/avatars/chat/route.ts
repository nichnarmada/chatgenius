import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { OpenAI } from "openai"
import { NextResponse, type NextRequest } from "next/server"
import {
  AvatarChat,
  ChatRequest,
  ChatResponse,
  ChannelMessage,
  DirectMessage,
  ChatMessage,
} from "@/types/avatar"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // This is a read-only operation in a Server Component
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user) {
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
    const { data: chatData, error: chatError } = await supabase
      .from("avatar_chats")
      .select(
        `
        id,
        title,
        config_id,
        created_by_user_id,
        created_at,
        updated_at,
        config:avatar_configs!inner (
          id,
          name,
          system_prompt,
          source_type,
          source_id
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

    if (!chatData) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    const chat = chatData as unknown as AvatarChat

    // Store user message
    const { error: messageError } = await supabase
      .from("avatar_chat_messages")
      .insert({
        chat_id: chatId,
        role: "user",
        content: message,
      })

    if (messageError) {
      console.error("Error storing user message:", messageError)
      return NextResponse.json(
        { error: "Failed to store message" },
        { status: 500 }
      )
    }

    // Get context based on source type
    let context = ""
    if (chat.config?.source_type === "channel") {
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("content, profiles!inner(display_name)")
        .eq("channel_id", chat.config.source_id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (messagesError) {
        console.error("Error fetching channel messages:", messagesError)
      } else if (messages) {
        const typedMessages = messages as unknown as ChannelMessage[]
        context = typedMessages
          .reverse()
          .map((msg) => `${msg.profiles.display_name}: ${msg.content}`)
          .join("\n")
      }
    } else if (chat.config?.source_type === "user") {
      const { data: messages, error: messagesError } = await supabase
        .from("direct_messages")
        .select("content, profiles!sender_id(display_name)")
        .eq("sender_id", chat.config.source_id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (messagesError) {
        console.error("Error fetching user messages:", messagesError)
      } else if (messages) {
        const typedMessages = messages as unknown as DirectMessage[]
        context = typedMessages
          .reverse()
          .map((msg) => `${msg.profiles.display_name}: ${msg.content}`)
          .join("\n")
      }
    }

    // Generate response using OpenAI
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: chat.config?.system_prompt || "",
      },
      {
        role: "system",
        content: context
          ? `Here is some context from previous messages:\n\n${context}`
          : "",
      },
      {
        role: "user",
        content: message,
      },
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
    })

    const response = completion.choices[0].message.content

    if (!response) {
      throw new Error("No response generated")
    }

    // Store AI response
    const { error: responseError } = await supabase
      .from("avatar_chat_messages")
      .insert({
        chat_id: chatId,
        role: "assistant",
        content: response,
      })

    if (responseError) {
      console.error("Error storing AI response:", responseError)
      return NextResponse.json(
        { error: "Failed to store response" },
        { status: 500 }
      )
    }

    // Update chat's updated_at timestamp
    const { error: updateError } = await supabase
      .from("avatar_chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId)

    if (updateError) {
      console.error("Error updating chat timestamp:", updateError)
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
