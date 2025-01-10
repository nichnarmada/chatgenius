import { createClient } from "@/utils/supabase/server"
import { USER_STATUS_CONFIG } from "@/constants/user-status"

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

  // Create new profile and user status in a transaction
  const { error } = await supabase.rpc("create_new_user", {
    p_user_id: userId,
    p_email: email,
    p_display_name: displayName || email,
    p_initial_status: USER_STATUS_CONFIG.offline.type,
  })

  if (error) {
    console.error("Error creating user:", error)
    throw error
  }
}
