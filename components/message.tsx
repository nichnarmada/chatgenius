import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Trash,
  Smile,
} from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { MessageInput } from "./chat-input"
import { ThreadModal } from "./thread/thread-modal"
import { FileAttachment } from "./file-attachment"
import { createClient } from "@/utils/supabase/client"
import { Message as MessageType, DirectMessage } from "@/types/message"
import { REACTION_EMOJIS } from "@/constants/emojis"

interface MessageProps {
  message: MessageType | DirectMessage
  onUpdate: (message: MessageType | DirectMessage) => void
  onDelete: (messageId: string) => void
  onAddReaction?: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>
  showThread?: boolean
  isInThreadModal?: boolean
}

export function Message({
  message,
  onUpdate,
  onDelete,
  onAddReaction,
  onRemoveReaction,
  showThread = true,
  isInThreadModal = false,
}: MessageProps) {
  console.log("Message props received:", {
    messageId: message.id,
    content: message.content,
    files: message.files,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isThreadOpen, setIsThreadOpen] = useState(false)
  const [isReactionOpen, setIsReactionOpen] = useState<boolean>(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Type guard to check if message is a DirectMessage
  const isDirectMessage = (
    msg: MessageType | DirectMessage
  ): msg is DirectMessage => {
    return "sender_id" in msg
  }

  // Get the user profile data based on message type
  const userProfile = isDirectMessage(message)
    ? message.sender
    : message.profile

  // Group reactions by emoji and get user IDs who reacted
  const reactionGroups = (message.reactions || []).reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          userIds: new Set(),
          reactionId: reaction.id,
        }
      }
      acc[reaction.emoji].count++
      acc[reaction.emoji].userIds.add(reaction.user_id)
      return acc
    },
    {} as Record<
      string,
      { count: number; userIds: Set<string>; reactionId: string }
    >
  )

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [supabase.auth])

  const handleUpdate = async (content: string) => {
    try {
      const response = await fetch("/api/messages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, messageId: message.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update message")
      }

      const updatedMessage = await response.json()
      onUpdate(updatedMessage)
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating message:", error)
      alert("Failed to update message")
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/messages?messageId=${message.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete message")
      }

      onDelete(message.id)
    } catch (error) {
      console.error("Error deleting message:", error)
      alert("Failed to delete message")
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      // If this is the only file and there's no content, delete the whole message
      if (
        message.files?.length === 1 &&
        !message.content &&
        message.files[0].id === fileId
      ) {
        await handleDelete()
        return
      }

      // Otherwise, just delete the file
      const response = await fetch(`/api/files?fileId=${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete file")
      }

      // Update the message in the UI by filtering out the deleted file
      onUpdate({
        ...message,
        files: message.files?.filter((f) => f.id !== fileId),
      })
    } catch (error) {
      console.error("Error deleting file:", error)
      alert("Failed to delete file")
    }
  }

  // Only show edit/delete options if user owns the message
  const canEditMessage =
    currentUserId ===
    (isDirectMessage(message) ? message.sender_id : message.user_id)

  if (!userProfile) {
    return null // or some fallback UI
  }

  return (
    <>
      <div className="group relative flex gap-3 px-4 py-2 hover:bg-muted/50">
        {/* Reaction and Action Buttons */}
        <div className="absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded-md border bg-background opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
          {/* Thread Button - Only show for channel messages */}
          {!isDirectMessage(message) && showThread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setIsThreadOpen(true)}
            >
              <MessageSquareText className="h-4 w-4" />
            </Button>
          )}

          {/* Reaction Button */}
          <Popover
            open={isReactionOpen || undefined}
            onOpenChange={(open: boolean) => setIsReactionOpen(open)}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto p-1">
              <div className="flex gap-1">
                {REACTION_EMOJIS.map((emoji) => {
                  const hasUserReacted = Boolean(
                    currentUserId &&
                      reactionGroups[emoji]?.userIds.has(currentUserId)
                  )
                  return (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      disabled={hasUserReacted}
                      onClick={() => {
                        if (!hasUserReacted && onAddReaction) {
                          onAddReaction(message.id, emoji)
                          setIsReactionOpen(false)
                        }
                      }}
                    >
                      {emoji}
                    </Button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* More Options Menu - Only show if user can edit */}
          {canEditMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Avatar className="h-8 w-8">
          <AvatarImage src={userProfile.avatar_url || undefined} />
          <AvatarFallback>
            {userProfile.display_name?.[0] ||
              userProfile.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {userProfile.display_name || userProfile.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {isEditing ? (
            <MessageInput
              autoFocus
              defaultValue={message.content}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-2">
              {message.content && (
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              )}
              {message.files && message.files.length > 0 && (
                <div className="space-y-2">
                  {message.files.map((file) => (
                    <FileAttachment
                      key={file.id}
                      file={file}
                      canDelete={canEditMessage}
                      onDelete={handleFileDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reactions */}
          {Object.entries(reactionGroups).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(reactionGroups).map(
                ([emoji, { count, userIds }]) => {
                  const hasUserReacted = Boolean(
                    currentUserId && userIds.has(currentUserId)
                  )
                  return (
                    <Badge
                      key={emoji}
                      variant={hasUserReacted ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (hasUserReacted && onRemoveReaction) {
                          onRemoveReaction(message.id, emoji)
                        } else if (!hasUserReacted && onAddReaction) {
                          onAddReaction(message.id, emoji)
                        }
                      }}
                    >
                      {emoji} {count}
                    </Badge>
                  )
                }
              )}
            </div>
          )}

          {/* Thread Count Badge */}
          {!isDirectMessage(message) &&
            message.thread_count > 0 &&
            !isInThreadModal && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsThreadOpen(true)}
              >
                {message.thread_count}{" "}
                {message.thread_count === 1 ? "reply" : "replies"}
              </Button>
            )}
        </div>
      </div>

      {/* Thread Modal */}
      {isThreadOpen && !isDirectMessage(message) && (
        <ThreadModal
          isOpen={isThreadOpen}
          parentMessage={message}
          onClose={() => setIsThreadOpen(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}
