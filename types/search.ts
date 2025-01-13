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
  channel_id: string | null
  sender_name: string
  sender_id: string
  receiver_name: string | null
  receiver_id: string | null
  parent_message_id: string | null
}

export interface SearchResponse {
  results: SearchResult[]
}

export interface SearchError {
  error: string
}
