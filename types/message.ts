import { Profile } from "./profile"

export interface Reaction {
  id: string
  emoji: string
  user_id: string
}

export interface Message {
  id: string
  content: string
  user_id: string
  channel_id: string
  created_at: string
  updated_at: string
  content_search: any // tsvector type
  thread_count: number
  profile: Profile
  reactions?: Reaction[]
}

export interface DirectMessage {
  id: string
  content: string
  created_at: string
  updated_at: string
  workspace_id: string
  sender_id: string
  receiver_id: string
  sender: Profile
  thread_count?: number
  reactions?: Reaction[]
}
