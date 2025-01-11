import { Message } from "../message"
import { ThreadMessage as ThreadMessageType } from "@/types/thread"
import { Message as MessageType, DirectMessage } from "@/types/message"

interface ThreadMessageProps {
  message: ThreadMessageType
  onUpdate: (message: ThreadMessageType) => void
  onDelete: (messageId: string) => void
  onAddReaction?: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>
}

export function ThreadMessage({
  message,
  onUpdate,
  onDelete,
  onAddReaction,
  onRemoveReaction,
}: ThreadMessageProps) {
  // Convert ThreadMessage to Message type
  const messageData: MessageType = {
    ...message,
    channel_id: "", // Thread messages don't need channel_id
    content_search: null, // Not needed for thread messages
    thread_count: 0, // Thread messages can't have threads
    profile: message.profile, // Use the profile property
  }

  // Handle message updates by converting back to ThreadMessage type
  const handleUpdate = (updatedMessage: MessageType | DirectMessage) => {
    if ("channel_id" in updatedMessage) {
      // Convert back to ThreadMessage type
      const threadMessage: ThreadMessageType = {
        ...updatedMessage,
        parent_message_id: message.parent_message_id,
        profile: updatedMessage.profile, // Use the profile property
      }
      onUpdate(threadMessage)
    }
  }

  return (
    <Message
      message={messageData}
      onUpdate={handleUpdate}
      onDelete={onDelete}
      onAddReaction={onAddReaction}
      onRemoveReaction={onRemoveReaction}
      showThread={false} // Disable threading in thread messages
    />
  )
}
