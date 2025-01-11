"use client"

import { Hash } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Message as MessageComponent } from "@/components/message"
import { Message } from "@/types/message"
import { Channel } from "@/types/workspace"
import { ChannelChatInput } from "@/components/chat-input"

interface ChannelPageProps {
  channel: Channel
  messages: Message[]
}

export function ChannelPage({
  channel,
  messages: initialMessages,
}: ChannelPageProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const messageChannel = supabase
      .channel(`channel_messages:${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            if (!messages.some((msg) => msg.id === payload.new.id)) {
              const { data: message } = await supabase
                .from("messages")
                .select(
                  `
                  *,
                  profile:user_id (
                    id,
                    email,
                    display_name,
                    avatar_url
                  ),
                  reactions (
                    id,
                    emoji,
                    user_id
                  )
                `
                )
                .eq("id", payload.new.id)
                .single()

              if (message) {
                setMessages((prev) => [...prev, message as Message])
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                }
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const { data: message } = await supabase
              .from("messages")
              .select(
                `
                *,
                profile:user_id (
                  id,
                  email,
                  display_name,
                  avatar_url
                ),
                reactions (
                  id,
                  emoji,
                  user_id
                )
              `
              )
              .eq("id", payload.new.id)
              .single()

            if (message) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === message.id ? (message as Message) : msg
                )
              )
            }
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== payload.old.id)
            )
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reactions",
          filter: `message_id=in.(${messages.map((m) => m.id).join(",")})`,
        },
        async () => {
          const { data } = await supabase
            .from("messages")
            .select(
              `
              *,
              profile:user_id (
                id,
                email,
                display_name,
                avatar_url
              ),
              reactions (
                id,
                emoji,
                user_id
              )
            `
            )
            .eq("channel_id", channel.id)
            .order("created_at", { ascending: true })

          if (data) {
            setMessages(data as Message[])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
    }
  }, [channel.id, messages, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSubmit(content: string) {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        channelId: channel.id,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Failed to send message")
    }
  }

  async function addReaction(messageId: string, emoji: string) {
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

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add reaction")
      }
    } catch (error) {
      console.error("Error adding reaction:", error)
      alert("Failed to add reaction")
    }
  }

  async function removeReaction(messageId: string, emoji: string) {
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

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to remove reaction")
      }
    } catch (error) {
      console.error("Error removing reaction:", error)
      alert("Failed to remove reaction")
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Channel Header */}
      <div className="flex h-[60px] min-h-[60px] items-center border-b px-4">
        <Hash className="mr-2 h-5 w-5" />
        <h2 className="text-lg font-semibold">{channel.name}</h2>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        <div className="flex min-h-full flex-col">
          <div className="px-4">
            {messages?.map((message) => (
              <MessageComponent
                key={message.id}
                message={message}
                onUpdate={(updatedMessage) => {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === updatedMessage.id
                        ? (updatedMessage as Message)
                        : msg
                    )
                  )
                }}
                onDelete={(messageId) => {
                  setMessages((prev) =>
                    prev.filter((msg) => msg.id !== messageId)
                  )
                }}
                onAddReaction={addReaction}
                onRemoveReaction={removeReaction}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="flex h-[60px] min-h-[60px] items-center border-t px-4">
        <ChannelChatInput channelName={channel.name} onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
