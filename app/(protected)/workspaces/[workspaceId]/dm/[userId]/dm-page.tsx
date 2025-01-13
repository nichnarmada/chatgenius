"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Message } from "@/components/message"
import { DirectMessage } from "@/types/message"
import { Profile } from "@/types/profile"
import { Workspace } from "@/types/workspace"
import { ChatInput } from "@/components/chat-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DMPageProps {
  otherUser: Profile
  messages: DirectMessage[]
  workspace: Workspace
}

export function DMPage({
  otherUser,
  messages: initialMessages,
  workspace,
}: DMPageProps) {
  const [messages, setMessages] = useState<DirectMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const messageChannel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reactions",
          filter: `dm_message_id=in.(${messages.map((m) => m.id).join(",")})`,
        },
        async () => {
          // Refetch messages to get updated reactions
          const { data } = await supabase
            .from("direct_messages")
            .select(
              `
              *,
              sender:sender_id (
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
            .eq("workspace_id", workspace.id)
            .or(`sender_id.eq.${otherUser.id},receiver_id.eq.${otherUser.id}`)
            .order("created_at", { ascending: true })

          if (data) {
            setMessages(data as DirectMessage[])
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        async (payload) => {
          // Only add the message if it's not already in the state
          if (!messages.some((msg) => msg.id === payload.new.id)) {
            // Fetch the complete message with user data
            const { data: message } = await supabase
              .from("direct_messages")
              .select(
                `
                *,
                sender:sender_id (
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
              setMessages((prev) => [...prev, message as DirectMessage])
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        async (payload) => {
          // Fetch the updated message with user data
          const { data: message } = await supabase
            .from("direct_messages")
            .select(
              `
              *,
              sender:sender_id (
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
                msg.id === message.id ? (message as DirectMessage) : msg
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
          table: "direct_messages",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
    }
  }, [workspace.id, otherUser.id, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSubmit(content: string, files?: File[]) {
    setIsLoading(true)
    setError(null)

    try {
      if (files && files.length > 0) {
        // Handle file upload
        const formData = new FormData()
        formData.append("content", content)
        formData.append("workspaceId", workspace.id)
        formData.append("receiverId", otherUser.id)
        files.forEach((file) => formData.append("file", file))

        const response = await fetch("/api/files", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Failed to upload file")
        }
      } else {
        // Handle text-only message
        const response = await fetch("/api/direct-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            workspaceId: workspace.id,
            receiverId: otherUser.id,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Failed to send message")
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
          dm_message_id: messageId,
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
          dm_message_id: messageId,
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
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="py-4">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              onUpdate={(updatedMessage) => {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === updatedMessage.id
                      ? (updatedMessage as DirectMessage)
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

      {/* Message Input */}
      <div className="flex h-[60px] min-h-[60px] items-center border-t px-4">
        <form
          className="w-full"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <ChatInput
            placeholder={`Message ${otherUser.display_name || otherUser.email}`}
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
