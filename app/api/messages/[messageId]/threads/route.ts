import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// GET thread messages for a specific parent message
export async function GET(request: NextRequest) {
  try {
    const messageId = request.nextUrl.pathname.split("/")[3]

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
      console.error("Auth error:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the parent message exists and user has access
    const { data: parentMessage, error: parentMessageError } = await supabase
      .from("messages")
      .select("channel_id")
      .eq("id", messageId)
      .single()

    if (parentMessageError || !parentMessage) {
      console.error("Parent message error:", parentMessageError)
      return NextResponse.json(
        { error: "Parent message not found" },
        { status: 404 }
      )
    }

    // Verify user has access to the channel
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("workspace_id")
      .eq("id", parentMessage.channel_id)
      .single()

    if (channelError || !channel) {
      console.error("Channel error:", channelError)
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
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
      console.error("Workspace member error:", workspaceMemberError)
      return NextResponse.json(
        { error: "Access to workspace denied" },
        { status: 403 }
      )
    }

    // Get thread messages
    const { data: messages, error: messagesError } = await supabase
      .from("thread_messages")
      .select("*")
      .eq("parent_message_id", messageId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("Thread messages error:", messagesError)
      return NextResponse.json(
        { error: "Failed to fetch thread messages" },
        { status: 500 }
      )
    }

    // Fetch profiles for all messages
    const userIds = Array.from(
      new Set(messages?.map((msg) => msg.user_id) || [])
    )
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, email")
      .in("id", userIds)

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError)
      return NextResponse.json(
        { error: "Failed to fetch profile data" },
        { status: 500 }
      )
    }

    // Fetch reactions for all messages
    const messageIds = messages?.map((msg) => msg.id) || []
    const { data: reactions, error: reactionsError } = await supabase
      .from("reactions")
      .select("*")
      .in("thread_message_id", messageIds)

    if (reactionsError) {
      console.error("Reactions fetch error:", reactionsError)
      return NextResponse.json(
        { error: "Failed to fetch reactions" },
        { status: 500 }
      )
    }

    // Combine messages with their profiles and reactions
    const messagesWithData = messages?.map((message) => ({
      ...message,
      profiles: profiles?.find((profile) => profile.id === message.user_id),
      reactions:
        reactions?.filter(
          (reaction) => reaction.thread_message_id === message.id
        ) || [],
    }))

    return NextResponse.json({ messages: messagesWithData })
  } catch (error) {
    console.error("Error in GET /api/messages/[messageId]/threads:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    )
  }
}

// POST a new thread message
export async function POST(request: NextRequest) {
  try {
    const messageId = request.nextUrl.pathname.split("/")[3]
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
      console.error("Auth error:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the parent message exists and user has access
    const { data: parentMessage, error: parentMessageError } = await supabase
      .from("messages")
      .select("channel_id")
      .eq("id", messageId)
      .single()

    if (parentMessageError || !parentMessage) {
      console.error("Parent message error:", parentMessageError)
      return NextResponse.json(
        { error: "Parent message not found" },
        { status: 404 }
      )
    }

    // Verify user has access to the channel
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("workspace_id")
      .eq("id", parentMessage.channel_id)
      .single()

    if (channelError || !channel) {
      console.error("Channel error:", channelError)
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
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
      console.error("Workspace member error:", workspaceMemberError)
      return NextResponse.json(
        { error: "Access to workspace denied" },
        { status: 403 }
      )
    }

    // Insert thread message
    const { data: threadMessage, error: messageError } = await supabase
      .from("thread_messages")
      .insert({
        content: content.trim(),
        parent_message_id: messageId,
        user_id: user.id,
      })
      .select("*")
      .single()

    if (messageError) {
      console.error("Thread message creation error:", messageError)
      return NextResponse.json(
        { error: "Failed to create thread message: " + messageError.message },
        { status: 500 }
      )
    }

    // Fetch the profile data separately
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, email")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json(
        { error: "Failed to fetch profile data" },
        { status: 500 }
      )
    }

    // Combine the data
    const message = {
      ...threadMessage,
      profiles: profile,
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error in POST /api/messages/[messageId]/threads:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    )
  }
}
