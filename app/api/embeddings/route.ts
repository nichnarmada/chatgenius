import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { OpenAI } from "openai"
import { NextResponse, type NextRequest } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const BATCH_SIZE = 10 // Process 10 embeddings at a time
const MAX_TOKENS = 8000 // OpenAI's text-embedding-3-small token limit

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

    if (userError || !user) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch pending embeddings (those with default vector)
    const { data: pendingEmbeddings, error: fetchError } = await supabase
      .from("avatar_embeddings")
      .select("id, content")
      .eq("embedding", "ARRAY[0.0]::vector(1536)")
      .limit(BATCH_SIZE)

    if (fetchError) {
      console.error("Error fetching pending embeddings:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch pending embeddings" },
        { status: 500 }
      )
    }

    if (!pendingEmbeddings || pendingEmbeddings.length === 0) {
      return NextResponse.json({ message: "No pending embeddings" })
    }

    // Process each embedding
    const updates = await Promise.all(
      pendingEmbeddings.map(async (item) => {
        try {
          // Generate embedding using OpenAI
          const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: item.content,
            encoding_format: "float",
          })

          const embedding = response.data[0].embedding

          // Update the embedding in the database
          const { error: updateError } = await supabase.rpc(
            "update_embedding_vector",
            {
              p_embedding_id: item.id,
              p_embedding: embedding,
            }
          )

          if (updateError) {
            console.error(`Error updating embedding ${item.id}:`, updateError)
            return { id: item.id, success: false }
          }

          return { id: item.id, success: true }
        } catch (error) {
          console.error(`Error processing embedding ${item.id}:`, error)
          return { id: item.id, success: false }
        }
      })
    )

    return NextResponse.json({
      processed: updates.length,
      successful: updates.filter((u) => u.success).length,
      failed: updates.filter((u) => !u.success).length,
    })
  } catch (error) {
    console.error("Error in embeddings endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
