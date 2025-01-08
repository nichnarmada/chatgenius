import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const channelId = formData.get("channelId") as string
    const dmId = formData.get("dmId") as string
    const workspaceId = formData.get("workspaceId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      )
    }

    if (!channelId && !dmId) {
      return NextResponse.json(
        { error: "Either channel ID or DM ID is required" },
        { status: 400 }
      )
    }

    // Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a workspace member" },
        { status: 403 }
      )
    }

    // Upload file to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileExt = file.name.split(".").pop()
    const filePath = `${workspaceId}/${channelId || dmId}/${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("files")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("files").getPublicUrl(filePath)

    // Store file metadata in Supabase
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .insert({
        workspace_id: workspaceId,
        channel_id: channelId || null,
        dm_id: dmId || null,
        uploaded_by_user_id: user.id,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        file_name: file.name,
        storage_path: filePath,
      })
      .select()
      .single()

    if (fileError) {
      return NextResponse.json(
        { error: "Failed to store file metadata" },
        { status: 500 }
      )
    }

    return NextResponse.json(fileData)
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")
    const dmId = searchParams.get("dmId")
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      )
    }

    // Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a workspace member" },
        { status: 403 }
      )
    }

    let query = supabase
      .from("files")
      .select("*")
      .eq("workspace_id", workspaceId)

    if (channelId) {
      query = query.eq("channel_id", channelId)
    }

    if (dmId) {
      query = query.eq("dm_id", dmId)
    }

    const { data: files, error: filesError } = await query

    if (filesError) {
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      )
    }

    return NextResponse.json(files)
  } catch (error) {
    console.error("File fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
