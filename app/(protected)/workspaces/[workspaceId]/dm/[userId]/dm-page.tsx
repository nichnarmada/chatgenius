"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Message } from "@/components/message"
import { DirectMessage } from "@/types/message"
import { Profile } from "@/types/profile"
import { Workspace } from "@/types/workspace"
import { ChatInput } from "@/components/chat-input"
import { toast } from "sonner"

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
  const [content, setContent] = useState("")

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
    if (!content.trim() && (!files || files.length === 0)) return

    setIsLoading(true)
    try {
      // First, upload any files if present
      const uploadedFiles = []
      if (files && files.length > 0) {
        for (const file of files) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("workspaceId", workspace.id)
          formData.append("dmId", otherUser.id)

          const uploadResponse = await fetch("/api/files", {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload file")
          }

          const fileData = await uploadResponse.json()
          uploadedFiles.push(fileData.id)
        }
      }

      // Then create the message with file references
      const response = await fetch("/api/direct-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          receiverId: otherUser.id,
          workspaceId: workspace.id,
          fileIds: uploadedFiles,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("Message creation error:", error)
        alert("Failed to send message")
        return
      }

      // Embedding is now handled by database triggers
      // No need to make a separate API call

      setContent("")
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
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
