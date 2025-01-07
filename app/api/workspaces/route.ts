import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get("name")?.toString()
    const image = formData.get("image") as File | null

    if (!name) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError)
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let image_url = null

    // Upload image if provided
    if (image && image.size > 0) {
      try {
        const fileExt = image.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("workspace-images")
          .upload(fileName, image)

        if (uploadError) {
          console.error("Image upload error:", uploadError)
          return NextResponse.json(
            { error: "Error uploading image: " + uploadError.message },
            { status: 500 }
          )
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("workspace-images").getPublicUrl(fileName)

        image_url = publicUrl
      } catch (uploadError) {
        console.error("Image upload error:", uploadError)
        return NextResponse.json(
          { error: "Error processing image" },
          { status: 500 }
        )
      }
    }

    // Create workspace
    try {
      const { data: workspace, error: insertError } = await supabase
        .from("workspaces")
        .insert([
          {
            name,
            image_url,
            created_by_user_id: session.user.id,
            members: [session.user.id],
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error("Workspace creation error:", insertError)
        return NextResponse.json(
          { error: "Error creating workspace: " + insertError.message },
          { status: 500 }
        )
      }

      // Create default general channel
      const { data: channel, error: channelError } = await supabase
        .from("channels")
        .insert([
          {
            name: "general",
            description: "This is the default channel for general discussions",
            workspace_id: workspace.id,
            created_by_user_id: session.user.id,
          },
        ])
        .select()
        .single()

      if (channelError) {
        console.error("Channel creation error:", channelError)
        return NextResponse.json(
          { error: "Error creating default channel: " + channelError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ ...workspace, defaultChannelId: channel.id })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
