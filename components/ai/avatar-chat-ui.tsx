"use client"

import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarConfig } from "@/types/avatar"

interface Message {
  id: string
  query: string
  response: string
  created_at: string
  isLoading?: boolean
}

interface AvatarChatUIProps {
  message: Message
  config: AvatarConfig
}

export function AvatarChatUI({ message, config }: AvatarChatUIProps) {
  return (
    <>
      <div key={message.id} className="space-y-4">
        {/* User Message */}
        <div className="group relative flex gap-3 px-4 py-2 hover:bg-muted/50">
          <Avatar className="h-8 w-8">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">You</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{message.query}</p>
          </div>
        </div>

        {/* Avatar Response */}
        <div className="group relative flex gap-3 px-4 py-2 hover:bg-muted/50">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`/avatars/${config.name.toLowerCase()}.png`} />
            <AvatarFallback>{config.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{config.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {message.isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm">{message.response}</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
