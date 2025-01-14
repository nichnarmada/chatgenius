"use client"

import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChatInput } from "@/components/chat-input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  query: string
  response: string
  created_at: string
}

interface AvatarChatUIProps {
  workspaceId: string
  avatarConfig: {
    id: string
    name: string
    system_prompt: string
    temperature: number
    context_length: number
  }
  messages: Message[]
  isLoading: boolean
  onSubmit: (content: string) => Promise<void>
}

export function AvatarChatUI({
  workspaceId,
  avatarConfig,
  messages,
  isLoading,
  onSubmit,
}: AvatarChatUIProps) {
  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.map((message) => (
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
                  <AvatarImage
                    src={`/avatars/${avatarConfig.name.toLowerCase()}.png`}
                  />
                  <AvatarFallback>{avatarConfig.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{avatarConfig.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">
                    {message.response}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <ChatInput
          placeholder={`Message ${avatarConfig.name}...`}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
