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
import { MessageInput } from "./message-input"
import { ThreadModal } from "./thread/thread-modal"
import { createClient } from "@/utils/supabase/client"

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

interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
}

interface Reaction {
  id: string
  emoji: string
  user_id: string
}

interface MessageProps {
  message: {
    id: string
    content: string
    created_at: string
    updated_at?: string
    thread_count?: number
    profiles?: Profile // from channel messages
    profile?: Profile // from channel messages (old structure)
    sender?: Profile // from DM messages
    reactions?: Reaction[]
  }
  onUpdate: (message: any) => void
  onDelete: (messageId: string) => void
  onAddReaction?: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>
  isDM?: boolean
  showThread?: boolean
}

export function Message({
  message,
  onUpdate,
  onDelete,
  onAddReaction,
  onRemoveReaction,
  isDM = false,
  showThread = true,
}: MessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isThreadOpen, setIsThreadOpen] = useState(false)
  const [isReactionOpen, setIsReactionOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Get the user profile data regardless of the source
  const userProfile = message.profiles || message.profile || message.sender

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
        <div className="absolute right-2 -top-3 flex items-center gap-0.5 transition-opacity duration-200 bg-background shadow-sm rounded-md border z-10 opacity-0 group-hover:opacity-100">
          {/* Thread Button - For creating new threads */}
          {showThread && (
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
                {additionalEmojis.map((emoji) => (
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
          <div className="flex flex-wrap items-center gap-1 mt-1">
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
                          } else if (onAddReaction) {
                            onAddReaction(message.id, emoji)
                          }
                        }}
                        className={`rounded-full h-7 px-2 text-sm cursor-pointer transition-colors duration-200 border inline-flex items-center ${
                          hasUserReacted
                            ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
                            : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {emoji}{" "}
                        <span className="ml-1 min-w-[12px] text-center">
                          {count}
                        </span>
                      </button>
                    )
                  }
                )}
              </>
            )}

            {/* Thread Count - Only show if there are replies */}
            {showThread &&
              message.thread_count != null &&
              message.thread_count > 0 && (
                <button
                  onClick={() => setIsThreadOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-2 py-1 rounded"
                >
                  <MessageSquareText className="h-3.5 w-3.5" />
                  {message.thread_count}{" "}
                  {message.thread_count === 1 ? "reply" : "replies"}
                </button>
              )}
          </div>
        </div>
      </div>

      {showThread && (
        <ThreadModal
          isOpen={isThreadOpen}
          onClose={() => setIsThreadOpen(false)}
          parentMessage={message as any}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}
