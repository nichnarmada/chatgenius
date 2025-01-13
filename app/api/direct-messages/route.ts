import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { content, workspaceId, receiverId } = await req.json()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from("direct_messages")
      .insert({
        content,
        workspace_id: workspaceId,
        sender_id: user.id,
        receiver_id: receiverId,
      })
      .select(
        `
        *,
        sender:sender_id (
          id,
          email,
          display_name,
          avatar_url
        ),
        files (
          id,
          name,
          size,
          type,
          url,
          created_at
        )
      `
      )
      .single()

    if (messageError) {
      throw messageError
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error in direct-messages POST:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
