"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Message as MessageComponent } from "@/components/message"
import { Message } from "@/types/message"
import { Channel } from "@/types/workspace"
import { ChatInput } from "@/components/chat-input"
import { useParams } from "next/navigation"

interface ChannelPageProps {
  channel: Channel
  messages: Message[]
}

export function ChannelPage({
  channel,
  messages: initialMessages,
}: ChannelPageProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const params = useParams()

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
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            const oldReaction = payload.old as {
              message_id: string
              id: string
            }

            // Immediately update the local state
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === oldReaction.message_id) {
                  return {
                    ...msg,
                    reactions: msg.reactions?.filter(
                      (r) => r.id !== oldReaction.id
                    ),
                  }
                }
                return msg
              })
            )
          } else {
            // Handle INSERT and UPDATE
            const messageId = (payload.new as { message_id?: string })
              ?.message_id
            if (messageId) {
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
                    user_id,
                    created_at
                  )
                `
                )
                .eq("id", messageId)
                .single()

              if (message) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === messageId ? (message as Message) : msg
                  )
                )
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status)
      })

    return () => {
      supabase.removeChannel(messageChannel)
    }
  }, [channel.id, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSubmit(content: string, files?: File[]) {
    setIsLoading(true)
    setError(null)

    try {
      let messageId: string | undefined

      if (files && files.length > 0) {
        // Handle file upload
        const formData = new FormData()
        formData.append("content", content)
        formData.append("channelId", channel.id)
        files.forEach((file) => formData.append("file", file))

        const response = await fetch("/api/files", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Failed to upload file")
        }
        messageId = data.messageId
      } else {
        // Handle text-only message
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
        messageId = data.id
      }

      // Generate embedding for the message
      if (messageId) {
        try {
          await fetch("/api/avatars/embed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messageId,
              messageType: "channel_message",
              workspaceId: params.workspaceId,
            }),
          })
        } catch (error) {
          console.error("Failed to generate embedding:", error)
          // Don't throw here as the message was still sent successfully
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
      throw err
    } finally {
      setIsLoading(false)
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

      // Immediately update local state
      const { id: deletedReactionId } = await response.json()
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: msg.reactions?.filter(
                (r) => r.id !== deletedReactionId
              ),
            }
          }
          return msg
        })
      )
    } catch (error) {
      console.error("Error removing reaction:", error)
      alert("Failed to remove reaction")
    }
  }

  return (
    <>
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
        <form
          className="w-full"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <ChatInput
            placeholder={`Message #${channel.name}`}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            showError={true}
            autoFocus={true}
          />
        </form>
      </div>
    </>
  )
}
