import { createClient } from "@/utils/supabase/server"

export async function createUserProfile(
  userId: string,
  email: string,
  displayName?: string
) {
  const supabase = await createClient()

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single()

  if (existingProfile) {
    return
  }

  // Create new profile
  const { error } = await supabase.from("profiles").insert([
    {
      id: userId,
      email,
      display_name: displayName || email,
      is_profile_setup: false,
    },
  ])

  if (error) {
    console.error("Error creating profile:", error)
    throw error
  }
}
