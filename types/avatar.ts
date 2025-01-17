import { Profile } from "./profile"

// Core types for avatar configuration
export type AvatarSourceType = "channel" | "user"

export interface AvatarConfig {
  id: string
  name: string
  system_prompt: string
  source_type: AvatarSourceType
  source_id: string
  created_by_user_id: string
  workspace_id: string
  created_at: string
  updated_at: string
  message_history_limit: number
}

// Chat types
export interface AvatarChat {
  id: string
  title: string
  config_id: string
  created_by_user_id: string
  workspace_id: string
  source_type: AvatarSourceType
  source_id: string
  created_at: string
  updated_at: string
  config?: AvatarConfig
  messages?: AvatarChatMessage[]
}

export interface AvatarChatMessage {
  id: string
  chat_id: string
  query: string
  response: string
  created_at: string
}

// Embedding types
export type EmbeddingStatus = "pending" | "processing" | "completed" | "failed"

export interface AvatarEmbedding {
  id: string
  content: string
  embedding: number[] | null
  status: EmbeddingStatus
  error?: string
  chat_id: string
  created_at: string
  updated_at: string
}

// UI types
export interface AvatarChatListItem {
  id: string
  name: string
  last_message_at: string
  preview: string
}

// API types
export interface ChatRequest {
  message: string
  chatId: string
}

export interface ChatResponse {
  response: string
}

// Context message types
export interface ChannelMessage {
  content: string
  profiles: Pick<Profile, "display_name">
}

export interface DirectMessage {
  content: string
  profiles: Pick<Profile, "display_name">
}
