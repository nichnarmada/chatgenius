import { type SearchResult } from "@/types/search"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { OpenAI } from "openai"
import { NextResponse, type NextRequest } from "next/server"

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
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, workspaceId, avatarConfigId } = await request.json()

    if (!message || !workspaceId || !avatarConfigId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Fetch avatar config
    const { data: avatarConfig } = await supabase
      .from("avatar_configs")
      .select("*")
      .eq("id", avatarConfigId)
      .single()

    if (!avatarConfig) {
      return NextResponse.json(
        { error: "Avatar config not found" },
        { status: 404 }
      )
    }

    // Get relevant context from embeddings
    const { data: relevantMessages } = await supabase.rpc("search_messages", {
      search_query: message,
      workspace_id: workspaceId,
    })

    // Format context for the prompt
    const context =
      relevantMessages
        ?.slice(0, avatarConfig.context_length)
        .map((msg: SearchResult) => `${msg.sender_name}: ${msg.content}`)
        .join("\n") || ""

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: avatarConfig.system_prompt,
        },
        {
          role: "system",
          content: `Here is some context from previous conversations and messages:\n\n${context}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: avatarConfig.temperature,
    })

    const response = completion.choices[0].message.content

    if (!response) {
      throw new Error("No response generated")
    }

    // Store the chat entry
    const { error: insertError } = await supabase.from("avatar_chats").insert({
      workspace_id: workspaceId,
      user_id: user.id,
      avatar_id: avatarConfigId,
      query: message,
      response: response,
      context_messages: relevantMessages || [],
    })

    if (insertError) {
      console.error("Error storing chat:", insertError)
      return NextResponse.json(
        { error: "Failed to store chat history" },
        { status: 500 }
      )
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in chat endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
