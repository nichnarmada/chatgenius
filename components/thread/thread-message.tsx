import { Message } from "../message"
import { ThreadMessage as ThreadMessageType } from "@/types/thread"

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
  return (
    <Message
      message={message}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onAddReaction={onAddReaction}
      onRemoveReaction={onRemoveReaction}
      showThread={false} // Disable threading in thread messages
    />
  )
}
