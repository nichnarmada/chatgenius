import { Profile } from "./profile"

export interface Reaction {
  id: string
  emoji: string
  user_id: string
}

// Base message interface for common properties
export interface BaseMessage {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  reactions?: Reaction[]
}

// Channel message
export interface Message extends BaseMessage {
  channel_id: string
  content_search: any // tsvector type
  thread_count: number
  profile: Profile
}

// Direct message
export interface DirectMessage extends BaseMessage {
  workspace_id: string
  sender_id: string
  receiver_id: string
  sender: Profile
  thread_count?: number
}
