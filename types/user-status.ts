export type UserStatusType = "online" | "offline" | "away" | "busy"

export interface UserStatus {
  id: string
  user_id: string
  status: UserStatusType
  custom_status: string | null
  updated_at: string
}
