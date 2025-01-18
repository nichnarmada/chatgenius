import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const {
      name,
      system_prompt,
      source_type,
      source_id,
      workspace_id,
      embedding_settings,
    } = await request.json()

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a workspace member" },
        { status: 403 }
      )
    }

    // Create avatar config
    const { data: config, error: configError } = await supabase
      .from("avatar_configs")
      .insert({
        name,
        system_prompt,
        source_type,
        source_id,
        created_by_user_id: user.id,
        workspace_id,
        embedding_settings,
      })
      .select()
      .single()

    if (configError) {
      console.error("Error creating config:", configError)
      return NextResponse.json(
        { error: "Failed to create config" },
        { status: 500 }
      )
    }

    // Create chat instance
    const { data: chat, error: chatError } = await supabase
      .from("avatar_chats")
      .insert({
        title: name,
        config_id: config.id,
        source_type,
        source_id,
        created_by_user_id: user.id,
        workspace_id,
      })
      .select()
      .single()

    if (chatError) {
      console.error("Error creating chat:", chatError)
      return NextResponse.json(
        { error: "Failed to create chat" },
        { status: 500 }
      )
    }

    return NextResponse.json({ chatId: chat.id })
  } catch (error) {
    console.error("Error in create endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
