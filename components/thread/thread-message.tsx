import { Message } from "../message"
import { ThreadMessage as ThreadMessageType } from "@/types/thread"

interface ThreadMessageProps {
  message: ThreadMessageType
  onUpdate: (message: ThreadMessageType) => void
  onDelete: (messageId: string) => void
}

export function ThreadMessage({
  message,
  onUpdate,
  onDelete,
}: ThreadMessageProps) {
  return (
    <Message
      message={message}
      onUpdate={onUpdate}
      onDelete={onDelete}
      showThread={false} // Disable threading in thread messages
    />
  )
}
