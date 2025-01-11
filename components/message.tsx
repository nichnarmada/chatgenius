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
import { createClient } from "@/utils/supabase/client"
import {
  BaseMessage,
  Message as MessageType,
  DirectMessage,
  Reaction,
} from "@/types/message"
import { Profile } from "@/types/profile"
import { REACTION_EMOJIS } from "@/constants/emojis"

interface MessageProps {
  message: MessageType | DirectMessage
  onUpdate: (message: MessageType | DirectMessage) => void
  onDelete: (messageId: string) => void
  onAddReaction?: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>
  showThread?: boolean
}

export function Message({
  message,
  onUpdate,
  onDelete,
  onAddReaction,
  onRemoveReaction,
  showThread = true,
}: MessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isThreadOpen, setIsThreadOpen] = useState(false)
  const [isReactionOpen, setIsReactionOpen] = useState(false)
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
        }
      }
      acc[reaction.emoji].count++
      acc[reaction.emoji].userIds.add(reaction.user_id)
      return acc
    },
    {} as Record<string, { count: number; userIds: Set<string> }>
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
  }, [])

  const handleUpdate = async (content: string) => {
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()
      if (data.message) {
        onUpdate(data.message)
        setIsEditing(false)
      }
    } catch (error) {
      console.error("Error updating message:", error)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/messages/${message.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        onDelete(message.id)
      }
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

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
            open={isReactionOpen}
            onOpenChange={(open) => setIsReactionOpen(open)}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto p-1">
              <div className="flex gap-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (onAddReaction) {
                        onAddReaction(message.id, emoji)
                        setIsReactionOpen(false)
                      }
                    }}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* More Options Menu */}
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
            <p className="text-sm">{message.content}</p>
          )}

          {/* Reactions and Thread Count */}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {message.reactions && message.reactions.length > 0 && (
              <>
                {Object.entries(reactionGroups).map(
                  ([emoji, { count, userIds }]) => {
                    const hasUserReacted =
                      currentUserId && userIds.has(currentUserId)
                    return (
                      <button
                        key={emoji}
                        onClick={() => {
                          if (hasUserReacted && onRemoveReaction) {
                            onRemoveReaction(message.id, emoji)
                          } else if (!hasUserReacted && onAddReaction) {
                            onAddReaction(message.id, emoji)
                          }
                        }}
                        className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-muted ${
                          hasUserReacted ? "bg-muted" : ""
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{count}</span>
                      </button>
                    )
                  }
                )}
              </>
            )}

            {/* Thread Count - Only show for channel messages */}
            {!isDirectMessage(message) && message.thread_count > 0 && (
              <button
                onClick={() => setIsThreadOpen(true)}
                className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
              >
                <MessageSquareText className="h-3 w-3" />
                <span>{message.thread_count}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thread Modal */}
      {!isDirectMessage(message) && (
        <ThreadModal
          isOpen={isThreadOpen}
          parentMessage={message}
          onUpdate={onUpdate}
          onClose={() => setIsThreadOpen(false)}
        />
      )}
    </>
  )
}
