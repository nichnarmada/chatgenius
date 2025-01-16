import { Profile } from "./profile"

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
}

export interface AvatarChatMessage {
  id: string
  chat_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface AvatarChat {
  id: string
  title: string
  created_at: string
  updated_at: string
  config_id: string
  created_by_user_id: string
  config?: AvatarConfig
  messages?: AvatarChatMessage[]
}

// For the chat list UI
export interface AvatarChatListItem {
  id: string
  name: string
  last_message_at: string
  preview: string
}

// For the chat API
export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

// For context messages
export interface ChannelMessage {
  content: string
  profiles: Pick<Profile, "display_name">
}

export interface DirectMessage {
  content: string
  profiles: Pick<Profile, "display_name">
}

// API Request/Response types
export interface ChatRequest {
  message: string
  chatId: string
}

export interface ChatResponse {
  response: string
}

export type EmbeddingSourceType =
  | "channel_message"
  | "direct_message"
  | "thread_message"
  | "document"

export interface AvatarEmbedding {
  id: string
  content: string
  embedding: number[]
  source_type: EmbeddingSourceType
  source_id: string
  avatar_config_id: string
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface EmbeddingUpdateResponse {
  processed: number
  successful: number
  failed: number
}
