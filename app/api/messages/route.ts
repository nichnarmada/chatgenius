import { createClient } from "@/utils/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { content, channelId } = json

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      )
    }

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      )
    }

    // Ensure user profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (!profile) {
      // Create profile if it doesn't exist
      const { error: createProfileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            email: user.email,
            display_name: user.user_metadata.display_name || user.email,
          },
        ])

      if (createProfileError) {
        console.error("Profile creation error:", createProfileError)
        return NextResponse.json(
          { error: "Error creating user profile" },
          { status: 500 }
        )
      }
    }

    // Verify channel exists and user has access
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("workspace_id")
      .eq("id", channelId)
      .single()

    if (channelError || !channel) {
      return NextResponse.json(
        { error: "Channel not found or access denied" },
        { status: 404 }
      )
    }

    // Verify user has access to workspace
    const { data: workspaceMember, error: workspaceMemberError } =
      await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("workspace_id", channel.workspace_id)
        .eq("user_id", user.id)
        .single()

    if (workspaceMemberError || !workspaceMember) {
      return NextResponse.json(
        { error: "Access to workspace denied" },
        { status: 403 }
      )
    }

    // Create message
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert([
        {
          content,
          channel_id: channelId,
          user_id: user.id,
        },
      ])
      .select(
        `
        *,
        profile:user_id (
          id,
          email,
          display_name
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

    if (insertError) {
      console.error("Message creation error:", insertError)
      return NextResponse.json(
        { error: "Error creating message: " + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const json = await request.json()
    const { content, messageId } = json

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      )
    }

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      )
    }

    // Update message
    const { data: message, error: updateError } = await supabase
      .from("messages")
      .update({ content })
      .eq("id", messageId)
      .eq("user_id", user.id) // Ensure user owns the message
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

    if (updateError) {
      console.error("Message update error:", updateError)
      return NextResponse.json(
        { error: "Error updating message" },
        { status: 500 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or you don't have permission to edit it" },
        { status: 404 }
      )
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get("messageId")

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      )
    }

    // Delete message
    const { error: deleteError } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("user_id", user.id) // Ensure user owns the message

    if (deleteError) {
      console.error("Message deletion error:", deleteError)
      return NextResponse.json(
        { error: "Error deleting message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
