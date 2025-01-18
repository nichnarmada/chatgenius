import { Profile } from "./profile"

// Source types
export type AvatarSourceType = "channel" | "user"

// Settings for embedding behavior
export interface EmbeddingSettings {
  recent_messages_count: number // 10-40 messages
  similarity_threshold: number // 0.0-1.0
  max_context_messages: number // How many similar messages to include
}

// The configuration for an AI avatar
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
  embedding_settings: EmbeddingSettings
}

// A message in the chat
export interface AvatarChatMessage {
  id: string
  chat_id: string
  query: string
  response: string
  created_at: string
}

// The chat instance
export interface AvatarChat {
  id: string
  title: string
  config_id: string
  source_type: AvatarSourceType
  source_id: string
  created_by_user_id: string
  workspace_id: string
  created_at: string
  updated_at: string
  config?: AvatarConfig
  messages?: AvatarChatMessage[]
}

// For the chat list UI
export interface AvatarChatListItem {
  id: string
  title: string
  last_message_at: string
  preview: string
}

// For embeddings
export type EmbeddingStatus = "pending" | "processing" | "completed" | "failed"

export interface AvatarEmbedding {
  id: string
  content: string
  embedding: number[] | null
  status: EmbeddingStatus
  error?: string
  source_type: AvatarSourceType
  source_id: string
  avatar_config_id: string
  workspace_id: string
  created_at: string
  updated_at: string
}

// API types
export interface ChatRequest {
  message: string
  chatId: string
}

export interface ChatResponse {
  response: string
}

// For context messages
export interface ContextMessage {
  content: string
  sender_name: string
  created_at: string
}
