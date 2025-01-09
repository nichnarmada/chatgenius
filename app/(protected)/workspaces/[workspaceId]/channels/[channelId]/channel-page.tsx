"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Hash, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Message } from "@/components/message"

const additionalEmojis = [
  "👍",
  "❤️",
  "😂",
  "🎉",
  "🤔",
  "👀",
  "✨",
  "🙌",
  "🔥",
  "💯",
]

interface Reaction {
  id: string
  emoji: string
  user_id: string
}

interface Message {
  id: string
  content: string
  created_at: string
  channel_id: string
  user_id: string
  profile: {
    id: string
    email: string
    display_name: string
    avatar_url?: string
  }
  reactions?: Reaction[]
}

interface ChannelPageProps {
  channel: any
  messages: Message[]
}

export function ChannelPage({
  channel,
  messages: initialMessages,
}: ChannelPageProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const messageChannel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reactions",
          filter: `message_id=in.(${messages.map((m) => m.id).join(",")})`,
        },
        async () => {
          // Refetch messages to get updated reactions
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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        async (payload) => {
          // Only add the message if it's not already in the state
          if (!messages.some((msg) => msg.id === payload.new.id)) {
            // Fetch the complete message with user data
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
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        async (payload) => {
          // Fetch the updated message with user data
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
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
    }
  }, [channel.id, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          channelId: channel.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      setContent("")
    } catch (error) {
      console.error("Error sending message:", error)
      alert(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
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
    <div className="flex-1 flex flex-col h-full">
      {/* Channel Header */}
      <div className="h-[60px] min-h-[60px] border-b flex items-center px-4">
        <Hash className="mr-2 h-5 w-5" />
        <h2 className="font-semibold text-lg">{channel.name}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col min-h-full">
          <div className="flex-1" />
          <div className="px-4">
            {messages?.map((message) => (
              <Message
                key={message.id}
                id={message.id}
                content={message.content}
                created_at={message.created_at}
                user={message.profile}
                reactions={message.reactions}
                onAddReaction={addReaction}
                onRemoveReaction={removeReaction}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="h-[60px] min-h-[60px] border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-center h-full">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channel.name}`}
            className="flex-grow mr-2"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
