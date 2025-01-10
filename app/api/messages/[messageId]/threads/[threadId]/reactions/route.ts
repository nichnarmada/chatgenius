import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// POST a new reaction to a thread message
export async function POST(request: NextRequest) {
  try {
    const threadId = request.nextUrl.pathname.split("/")[5]
    const { emoji } = await request.json()

    let response = NextResponse.next({
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
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from("reactions")
      .select("id")
      .eq("thread_message_id", threadId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .single()

    if (existingReaction) {
      return NextResponse.json(
        { error: "Reaction already exists" },
        { status: 400 }
      )
    }

    // Add reaction
    const { data: insertedReaction, error: insertError } = await supabase
      .from("reactions")
      .insert({
        thread_message_id: threadId,
        user_id: user.id,
        emoji,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting reaction:", insertError)
      return NextResponse.json(
        { error: "Failed to add reaction: " + insertError.message },
        { status: 500 }
      )
    }

    // Get updated thread message with reactions and profile
    const { data: message, error: messageError } = await supabase
      .from("thread_messages")
      .select(
        `
        *,
        profile:user_id (
          id,
          email,
          display_name,
          avatar_url
        ),
        reactions (
          id,
          emoji,
          user_id
        )
      `
      )
      .eq("id", threadId)
      .single()

    if (messageError) {
      console.error("Error fetching updated message:", messageError)
      return NextResponse.json(
        { error: "Failed to fetch updated message: " + messageError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error(
      "Error in POST /api/messages/[messageId]/threads/[threadId]/reactions:",
      error
    )
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    )
  }
}

// DELETE a reaction from a thread message
export async function DELETE(request: NextRequest) {
  try {
    const threadId = request.nextUrl.pathname.split("/")[5]
    const emoji = request.nextUrl.pathname.split("/").pop()

    if (!emoji) {
      return NextResponse.json(
        { error: "Emoji parameter is required" },
        { status: 400 }
      )
    }

    let response = NextResponse.next({
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
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Remove reaction
    await supabase
      .from("reactions")
      .delete()
      .eq("thread_message_id", threadId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)

    // Get updated thread message with reactions and profile
    const { data: message, error: messageError } = await supabase
      .from("thread_messages")
      .select(
        `
        *,
        profile:user_id (
          id,
          email,
          display_name,
          avatar_url
        ),
        reactions (
          id,
          emoji,
          user_id
        )
      `
      )
      .eq("id", threadId)
      .single()

    if (messageError) {
      return NextResponse.json(
        { error: "Failed to fetch updated message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error(
      "Error in DELETE /api/messages/[messageId]/threads/[threadId]/reactions:",
      error
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
