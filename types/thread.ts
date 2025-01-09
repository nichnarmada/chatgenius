import { Profile } from "./profile"
import { Reaction } from "./message"

export interface ThreadMessage {
  id: string
  content: string
  user_id: string
  parent_message_id: string
  created_at: string
  updated_at: string
  profiles: Profile
  reactions?: Reaction[]
}
