import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MoreHorizontal, Smile } from "lucide-react"
import { useState } from "react"

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
          <PopoverContent sideOffset={5} className="w-auto p-1">
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
                {Object.entries(
                  reactions.reduce(
                    (acc, reaction) => {
                      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
                      return acc
                    },
                    {} as Record<string, number>
                  )
                ).map(([emoji, count]) => (
                  <span
                    key={emoji}
                    onClick={() => onRemoveReaction(id, emoji)}
                    className="bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    {emoji} {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
