import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// PATCH (update) a thread message
export async function PATCH(request: NextRequest) {
  try {
    const threadId = request.nextUrl.pathname.split("/")[5]
    const { content } = await request.json()

    // Validate input
    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      )
    }

    const response = NextResponse.next({
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

    // Update thread message
    const { data: message, error: messageError } = await supabase
      .from("thread_messages")
      .update({
        content: content.trim(),
      })
      .eq("id", threadId)
      .eq("user_id", user.id) // Ensure user owns the message
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        user_id,
        profiles:user_id (
          display_name,
          avatar_url,
          email
        )
      `
      )
      .single()

    if (messageError) {
      return NextResponse.json(
        { error: "Failed to update thread message" },
        { status: 500 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: "Thread message not found or unauthorized" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error(
      "Error in PATCH /api/messages/[messageId]/threads/[threadId]:",
      error
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE a thread message
export async function DELETE(request: NextRequest) {
  try {
    const threadId = request.nextUrl.pathname.split("/")[5]

    const response = NextResponse.next({
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

    // Delete thread message
    const { error: deleteError } = await supabase
      .from("thread_messages")
      .delete()
      .eq("id", threadId)
      .eq("user_id", user.id) // Ensure user owns the message

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete thread message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(
      "Error in DELETE /api/messages/[messageId]/threads/[threadId]:",
      error
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
