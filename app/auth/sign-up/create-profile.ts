import { createClient } from "@/utils/supabase/server"
import { USER_STATUS_CONFIG } from "@/constants/user-status"

export async function createUserProfile(
  userId: string,
  email: string,
  displayName?: string
) {
  const supabase = await createClient()

  // Call the create_new_user stored procedure
  const { error } = await supabase.rpc("create_new_user", {
    p_user_id: userId,
    p_email: email,
    p_display_name: displayName || email.split("@")[0],
    p_initial_status: USER_STATUS_CONFIG.offline.type,
  })

  if (error) {
    console.error("Error creating user:", error)
    throw error
  }
}
