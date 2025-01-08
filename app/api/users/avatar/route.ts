import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import sharp from "sharp"

const AVATAR_SIZE = 400 // Size in pixels for the square avatar

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

    const formData = await request.formData()
    const file = formData.get("avatar") as File

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

    console.log("Processing image...")
    // Process the image
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Use sharp to process the image
    const processedImageBuffer = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: 80 })
      .toBuffer()

    const filePath = `${user.id}/${Date.now()}.webp`
    console.log("File path:", filePath)

    // Try to upload directly without checking bucket
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("avatars")
      .upload(filePath, processedImageBuffer, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload avatar. Please try again." },
        { status: 500 }
      )
    }

    console.log("Upload successful:", uploadData)

    // Get public URL for the uploaded avatar
    const {
      data: { publicUrl },
    } = adminClient.storage.from("avatars").getPublicUrl(filePath)

    console.log("Generated public URL:", publicUrl)

    // Update user's profile with new avatar URL
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id)

    if (profileError) {
      console.error("Profile update error:", profileError)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({ avatarUrl: publicUrl })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
