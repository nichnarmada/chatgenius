import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { message_id, dm_message_id, thread_message_id, emoji } =
      await request.json()

    // Validate input
    if (!emoji || (!message_id && !dm_message_id && !thread_message_id)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Insert the reaction
    const { error } = await supabase.from("reactions").insert({
      message_id,
      dm_message_id,
      thread_message_id,
      emoji,
      user_id: session.user.id,
    })

    if (error) {
      console.error("Error adding reaction:", error)
      return NextResponse.json(
        { error: "Failed to add reaction" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/reactions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { message_id, dm_message_id, thread_message_id, emoji } =
      await request.json()

    // Validate input
    if (!emoji || (!message_id && !dm_message_id && !thread_message_id)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the reaction
    const { error } = await supabase
      .from("reactions")
      .delete()
      .match({
        ...(message_id
          ? { message_id }
          : dm_message_id
            ? { dm_message_id }
            : { thread_message_id }),
        emoji,
        user_id: session.user.id,
      })

    if (error) {
      console.error("Error removing reaction:", error)
      return NextResponse.json(
        { error: "Failed to remove reaction" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/reactions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
