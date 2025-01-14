"use client"

import { useState } from "react"
import { toast } from "sonner"
import { AvatarChatUI } from "@/components/ai/avatar-chat-ui"

interface Message {
  id: string
  query: string
  response: string
  created_at: string
}

interface AvatarConfig {
  id: string
  name: string
  system_prompt: string
  temperature: number
  context_length: number
}

interface AvatarPageProps {
  workspaceId: string
  avatarConfig: AvatarConfig
  messages: Message[]
}

export function AvatarPage({
  workspaceId,
  avatarConfig,
  messages: initialMessages,
}: AvatarPageProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (content: string) => {
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/avatars/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          workspaceId,
          avatarConfigId: avatarConfig.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()

      const newMessage = {
        id: crypto.randomUUID(),
        query: content,
        response: data.response,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, newMessage])
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AvatarChatUI
      workspaceId={workspaceId}
      avatarConfig={avatarConfig}
      messages={messages}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  )
}
