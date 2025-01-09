"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hash, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        async (payload) => {
          // Fetch the complete message with user data
          const { data: message } = await supabase
            .from("messages")
            .select(
              `
              *,
              profile:user_id (
                id,
                email,
                display_name
              )
            `
            )
            .eq("id", payload.new.id)
            .single()

          if (message) {
            setMessages((prev) => [...prev, message as Message])
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
                display_name
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

      setMessages((prev) => [...prev, data])
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Channel Header */}
      <div className="h-[60px] border-b flex items-center px-4">
        <Hash className="mr-2 h-5 w-5" />
        <h2 className="font-semibold text-lg">{channel.name}</h2>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-grow p-4">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-4">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={msg.profile?.avatar_url} />
                <AvatarFallback>
                  {msg.profile?.display_name?.charAt(0) ||
                    msg.profile?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">
                    {msg.profile?.display_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mt-1 text-sm">{msg.content}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="h-[60px] border-t flex items-center px-4">
        <form onSubmit={handleSubmit} className="flex items-center w-full">
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
