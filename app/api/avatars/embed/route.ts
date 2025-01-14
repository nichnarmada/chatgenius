import { createServerClient } from "@supabase/ssr"
import { OpenAI } from "openai"
import { NextResponse, type NextRequest } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Function to generate embeddings using OpenAI
async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  })
  return response.data[0].embedding
}

// Function to process a message and store its embedding
async function processMessage({
  content,
  messageId,
  messageType,
  workspaceId,
  userId,
  supabase,
}: {
  content: string
  messageId: string
  messageType: "channel_message" | "thread_message" | "direct_message"
  workspaceId: string
  userId: string
  supabase: ReturnType<typeof createServerClient>
}) {
  try {
    const embedding = await generateEmbedding(content)

    // Prepare the insert data based on message type
    const insertData = {
      workspace_id: workspaceId,
      user_id: userId,
      content,
      embedding,
      embedding_type: messageType,
      [messageType === "channel_message"
        ? "message_id"
        : messageType === "thread_message"
          ? "thread_message_id"
          : "direct_message_id"]: messageId,
    }

    const { error } = await supabase
      .from("avatar_embeddings")
      .insert([insertData])

    if (error) {
      console.error("Error storing embedding:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error processing message:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
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

  try {
    const body = await request.json()
    const { messageId, messageType, workspaceId } = body

    // Fetch the message content based on type
    let content: string | null = null
    let userId: string | null = null

    switch (messageType) {
      case "channel_message": {
        const { data: message } = await supabase
          .from("messages")
          .select("content, user_id")
          .eq("id", messageId)
          .single()
        if (message) {
          content = message.content
          userId = message.user_id
        }
        break
      }
      case "thread_message": {
        const { data: message } = await supabase
          .from("thread_messages")
          .select("content, user_id")
          .eq("id", messageId)
          .single()
        if (message) {
          content = message.content
          userId = message.user_id
        }
        break
      }
      case "direct_message": {
        const { data: message } = await supabase
          .from("direct_messages")
          .select("content, sender_id")
          .eq("id", messageId)
          .single()
        if (message) {
          content = message.content
          userId = message.sender_id
        }
        break
      }
    }

    if (!content || !userId) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    const success = await processMessage({
      content,
      messageId,
      messageType,
      workspaceId,
      userId,
      supabase,
    })

    if (!success) {
      return NextResponse.json(
        { error: "Failed to process message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in embedding route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
