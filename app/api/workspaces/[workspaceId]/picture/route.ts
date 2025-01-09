import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import sharp from "sharp"

const WORKSPACE_IMAGE_SIZE = 400 // Size in pixels for the square workspace image

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get workspaceId from the URL
    const url = new URL(request.url)
    const workspaceId = url.pathname.split("/")[3] // /api/workspaces/[workspaceId]/picture

    // Check if user has access to this workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("picture") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    console.log("Processing workspace image...")
    // Process the image
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Use sharp to process the image
    const processedImageBuffer = await sharp(buffer)
      .resize(WORKSPACE_IMAGE_SIZE, WORKSPACE_IMAGE_SIZE, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: 80 })
      .toBuffer()

    const filePath = `${workspace.id}/${Date.now()}.webp`
    console.log("File path:", filePath)

    // Upload to workspace-pictures bucket
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("workspace-pictures")
      .upload(filePath, processedImageBuffer, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload workspace picture. Please try again." },
        { status: 500 }
      )
    }

    console.log("Upload successful:", uploadData)

    // Get public URL for the uploaded picture
    const {
      data: { publicUrl },
    } = adminClient.storage.from("workspace-pictures").getPublicUrl(filePath)

    console.log("Generated public URL:", publicUrl)

    // Update workspace with new picture URL
    const { error: updateError } = await supabase
      .from("workspaces")
      .update({ picture_url: publicUrl })
      .eq("id", workspace.id)

    if (updateError) {
      console.error("Workspace update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update workspace" },
        { status: 500 }
      )
    }

    return NextResponse.json({ pictureUrl: publicUrl })
  } catch (error) {
    console.error("Workspace picture upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
