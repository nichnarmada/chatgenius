import { Message as MessageType } from "@/types/message"
import { ThreadMessage as ThreadMessageType } from "@/types/thread"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Message } from "../message"
import { ThreadMessage } from "./thread-message"
import { ThreadReplyInput } from "./thread-reply-input"
import { useEffect, useState } from "react"

interface ThreadModalProps {
  isOpen: boolean
  onClose: () => void
  parentMessage: MessageType
}

export function ThreadModal({
  isOpen,
  onClose,
  parentMessage,
}: ThreadModalProps) {
  const [threadMessages, setThreadMessages] = useState<ThreadMessageType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen && parentMessage) {
      loadThreadMessages()
    }
  }, [isOpen, parentMessage])

  const loadThreadMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${parentMessage.id}/threads`)
      const data = await response.json()
      if (data.messages) {
        setThreadMessages(data.messages)
      }
    } catch (error) {
      console.error("Error loading thread messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewReply = async (content: string) => {
    try {
      const response = await fetch(
        `/api/messages/${parentMessage.id}/threads`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      )
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to send reply")
      }
      if (data.message) {
        setThreadMessages((prev) => [...prev, data.message])
      }
    } catch (error) {
      console.error("Error sending thread reply:", error)
      throw error
    }
  }

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emoji }),
      })
      const data = await response.json()
      if (data.message) {
        setThreadMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? data.message : msg))
        )
      }
    } catch (error) {
      console.error("Error adding reaction:", error)
    }
  }

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(
        `/api/messages/${messageId}/reactions/${emoji}`,
        {
          method: "DELETE",
        }
      )
      if (response.ok) {
        const data = await response.json()
        setThreadMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? data.message : msg))
        )
      }
    } catch (error) {
      console.error("Error removing reaction:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Thread</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {/* Parent Message */}
          <div className="border-b pb-4">
            <Message
              message={parentMessage}
              onUpdate={() => {}}
              onDelete={() => {}}
              showThread={false}
            />
          </div>

          {/* Thread Messages */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center">Loading replies...</div>
            ) : threadMessages.length > 0 ? (
              threadMessages.map((message) => (
                <ThreadMessage
                  key={message.id}
                  message={message}
                  onUpdate={(updatedMessage) => {
                    setThreadMessages((prev) =>
                      prev.map((m) =>
                        m.id === updatedMessage.id ? updatedMessage : m
                      )
                    )
                  }}
                  onDelete={(messageId) => {
                    setThreadMessages((prev) =>
                      prev.filter((m) => m.id !== messageId)
                    )
                  }}
                  onAddReaction={handleAddReaction}
                  onRemoveReaction={handleRemoveReaction}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                No replies yet
              </div>
            )}
          </div>
        </div>

        {/* Reply Input */}
        <div className="border-t p-4">
          <ThreadReplyInput onSend={handleNewReply} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
