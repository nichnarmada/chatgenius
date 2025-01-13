import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
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

    // Insert the reaction
    const { error } = await supabase.from("reactions").insert({
      message_id,
      dm_message_id,
      thread_message_id,
      emoji,
      user_id: user.id,
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

export async function DELETE(request: NextRequest) {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
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

    // First find the reaction to delete
    const { data: existingReaction, error: findError } = await supabase
      .from("reactions")
      .select("id")
      .match({
        ...(message_id
          ? { message_id }
          : dm_message_id
            ? { dm_message_id }
            : { thread_message_id }),
        emoji,
        user_id: user.id,
      })
      .single()

    if (findError || !existingReaction) {
      console.error("Error finding reaction:", findError)
      return NextResponse.json({ error: "Reaction not found" }, { status: 404 })
    }

    // Delete the reaction
    const { error: deleteError } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existingReaction.id)

    if (deleteError) {
      console.error("Error removing reaction:", deleteError)
      return NextResponse.json(
        { error: "Failed to remove reaction" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: existingReaction.id })
  } catch (error) {
    console.error("Error in DELETE /api/reactions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
