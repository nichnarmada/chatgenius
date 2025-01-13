export type MessageType =
  | "channel_message"
  | "thread_message"
  | "direct_message"

export interface SearchResult {
  id: string
  content: string
  created_at: string
  message_type: MessageType
  channel_name: string | null
  sender_name: string
  receiver_name: string | null
  parent_message_id: string | null
}

export interface SearchResponse {
  results: SearchResult[]
}

export interface SearchError {
  error: string
}
