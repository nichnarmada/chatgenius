import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MoreHorizontal, Smile } from "lucide-react"
import { useEffect, useState } from "react"
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

interface User {
  id: string
  email: string
  display_name: string
  avatar_url?: string
}

interface Reaction {
  id: string
  emoji: string
  user_id: string
}

interface MessageProps {
  id: string
  content: string
  created_at: string
  user: User
  reactions?: Reaction[]
  isDM?: boolean
  onAddReaction: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction: (messageId: string, emoji: string) => Promise<void>
}

export function Message({
  id,
  content,
  created_at,
  user,
  reactions = [],
  isDM = false,
  onAddReaction,
  onRemoveReaction,
}: MessageProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

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

  // Group reactions by emoji and get user IDs who reacted
  const reactionGroups = reactions.reduce(
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

  return (
    <div
      className={`group relative py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 ${isOpen && "bg-gray-100 dark:bg-gray-800"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isOpen) {
          setIsHovered(false)
        }
      }}
    >
      <div
        className={`absolute right-2 -top-3 flex items-center gap-0.5 transition-opacity duration-200 bg-background shadow-sm rounded-md border z-10 ${isHovered || isOpen ? "opacity-100" : "opacity-0"}`}
      >
        <Popover
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) {
              setIsHovered(false)
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" sideOffset={10} className="w-auto p-1">
            <div className="flex gap-1">
              {additionalEmojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onAddReaction(id, emoji)
                    setIsOpen(false)
                  }}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-4 py-1">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>
              {user.display_name?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm">{user.display_name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="mt-0.5 text-sm">{content}</div>
            {reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(reactionGroups).map(
                  ([emoji, { count, userIds }]) => {
                    const hasUserReacted =
                      currentUserId && userIds.has(currentUserId)
                    return (
                      <span
                        key={emoji}
                        onClick={() => {
                          if (hasUserReacted) {
                            onRemoveReaction(id, emoji)
                          } else {
                            onAddReaction(id, emoji)
                          }
                        }}
                        className={`rounded-full px-2 py-1 text-sm cursor-pointer transition-colors duration-200 border ${
                          hasUserReacted
                            ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
                            : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {emoji}{" "}
                        <span className="ml-1 inline-block min-w-[12px] text-center">
                          {count}
                        </span>
                      </span>
                    )
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
