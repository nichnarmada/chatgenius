import { createClient } from "@/utils/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const messageId = formData.get("messageId") as string
    const dmMessageId = formData.get("dmMessageId") as string
    const content = formData.get("content") as string
    const channelId = formData.get("channelId") as string
    const workspaceId = formData.get("workspaceId") as string
    const receiverId = formData.get("receiverId") as string

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!channelId && !workspaceId) {
      return NextResponse.json(
        { error: "Either channelId or workspaceId is required" },
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

    // Upload file to Supabase Storage
    const { data: fileData, error: uploadError } = await supabase.storage
      .from("message-files")
      .upload(`${user.id}/${Date.now()}-${file.name}`, file)

    if (uploadError) {
      console.error("File upload error:", uploadError)
      return NextResponse.json(
        { error: "Error uploading file" },
        { status: 500 }
      )
    }

    // Get file URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("message-files").getPublicUrl(fileData.path)

    let message
    // Create message
    if (channelId) {
      const { data, error: messageError } = await supabase
        .from("messages")
        .insert([
          {
            content: content || "",
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
          )
        `
        )
        .single()

      if (messageError) {
        console.error("Message creation error:", messageError)
        return NextResponse.json(
          { error: "Error creating message" },
          { status: 500 }
        )
      }
      message = data
    } else {
      const { data, error: dmError } = await supabase
        .from("direct_messages")
        .insert([
          {
            content: content || "",
            workspace_id: workspaceId,
            sender_id: user.id,
            receiver_id: receiverId,
          },
        ])
        .select()
        .single()

      if (dmError) {
        console.error("DM creation error:", dmError)
        return NextResponse.json(
          { error: "Error creating direct message" },
          { status: 500 }
        )
      }
      message = data
    }

    // Create file record
    const { data: fileRecord, error: fileError } = await supabase
      .from("files")
      .insert([
        {
          message_id: channelId ? message.id : null,
          dm_message_id: workspaceId ? message.id : null,
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
        },
      ])
      .select()
      .single()

    if (fileError) {
      console.error("File record creation error:", fileError)
      return NextResponse.json(
        { error: "Error creating file record" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message, file: fileRecord })
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
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
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

    // Get file info
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("*, message:message_id(user_id), dm:dm_message_id(sender_id)")
      .eq("id", fileId)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Check ownership
    if (
      (file.message && file.message.user_id !== user.id) ||
      (file.dm && file.dm.sender_id !== user.id)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("message-files")
      .remove([file.url.split("/").pop()!])

    if (storageError) {
      console.error("Storage deletion error:", storageError)
      return NextResponse.json(
        { error: "Error deleting file from storage" },
        { status: 500 }
      )
    }

    // Delete file record
    const { error: deleteError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId)

    if (deleteError) {
      console.error("File record deletion error:", deleteError)
      return NextResponse.json(
        { error: "Error deleting file record" },
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
