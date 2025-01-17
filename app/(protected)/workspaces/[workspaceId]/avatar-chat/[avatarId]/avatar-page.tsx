"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { AvatarChatUI } from "@/components/ai/avatar-chat-ui"
import { ChatInput } from "@/components/chat-input"
import { AvatarConfig } from "@/types/avatar"

interface Message {
  id: string
  query: string
  response: string
  created_at: string
  isLoading?: boolean
}

interface AvatarPageProps {
  workspaceId: string
  avatarConfig: AvatarConfig
  messages: Message[]
  chatId: string
}

export function AvatarPage({
  workspaceId,
  avatarConfig,
  messages: initialMessages,
  chatId,
}: AvatarPageProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (content: string, _files?: File[]) => {
    if (!content.trim()) return

    // Immediately add user message and loading state
    const tempMessageId = crypto.randomUUID()
    const newMessage: Message = {
      id: tempMessageId,
      query: content,
      response: "",
      created_at: new Date().toISOString(),
      isLoading: true,
    }

    setMessages((prev) => [...prev, newMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/avatars/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content.trim(),
          chatId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()

      // Update the message with the response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessageId
            ? {
                ...msg,
                response: data.response,
                isLoading: false,
              }
            : msg
        )
      )
    } catch (error) {
      // Handle error state in the message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessageId
            ? {
                ...msg,
                response: "Sorry, there was an error generating the response.",
                isLoading: false,
              }
            : msg
        )
      )
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        <div className="flex min-h-full flex-col">
          <div className="px-4">
            {messages?.map((message) => (
              <AvatarChatUI
                key={message.id}
                avatarConfig={avatarConfig}
                message={message}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="flex h-[60px] min-h-[60px] items-center border-t px-4">
        <form
          className="w-full"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <ChatInput
            placeholder={`Message ${avatarConfig.name}...`}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            showError={true}
            autoFocus={true}
          />
        </form>
      </div>
    </>
  )
}
