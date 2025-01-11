import { Message as MessageType } from "@/types/message"
import { ThreadMessage as ThreadMessageType } from "@/types/thread"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Message } from "../message"
import { ThreadMessage } from "./thread-message"
import { ThreadChatInput } from "../chat-input"
import { useEffect, useState } from "react"

interface ThreadModalProps {
  isOpen: boolean
  onClose: () => void
  parentMessage: MessageType
  onUpdate: (message: MessageType) => void
}

export function ThreadModal({
  isOpen,
  onClose,
  parentMessage,
  onUpdate,
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
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          thread_message_id: messageId,
          emoji,
        }),
      })
      const data = await response.json()
      if (data.success) {
        await loadThreadMessages()
      }
    } catch (error) {
      console.error("Error adding reaction:", error)
    }
  }

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch("/api/reactions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          thread_message_id: messageId,
          emoji,
        }),
      })
      if (response.ok) {
        await loadThreadMessages()
      }
    } catch (error) {
      console.error("Error removing reaction:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Thread</DialogTitle>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Parent Message */}
          <div className="border-b pb-4">
            <Message
              message={parentMessage}
              onUpdate={(updatedMessage) => {
                onUpdate(updatedMessage as MessageType)
              }}
              onDelete={() => {}}
              onAddReaction={async (messageId, emoji) => {
                try {
                  const response = await fetch("/api/reactions", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      message_id: messageId,
                      emoji,
                    }),
                  })
                  if (response.ok) {
                    // Fetch the updated parent message
                    const updatedResponse = await fetch(
                      `/api/messages/${messageId}`
                    )
                    if (updatedResponse.ok) {
                      const { message } = await updatedResponse.json()
                      if (message) {
                        onUpdate(message)
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error adding reaction:", error)
                }
              }}
              onRemoveReaction={async (messageId, emoji) => {
                try {
                  const response = await fetch("/api/reactions", {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      message_id: messageId,
                      emoji,
                    }),
                  })
                  if (response.ok) {
                    // Fetch the updated parent message
                    const updatedResponse = await fetch(
                      `/api/messages/${messageId}`
                    )
                    if (updatedResponse.ok) {
                      const { message } = await updatedResponse.json()
                      if (message) {
                        onUpdate(message)
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error removing reaction:", error)
                }
              }}
              showThread={false}
            />
          </div>

          {/* Thread Messages */}
          <div>
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
          <ThreadChatInput onSubmit={handleNewReply} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
