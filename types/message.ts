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
  profiles: Profile
  reactions?: Reaction[]
}
