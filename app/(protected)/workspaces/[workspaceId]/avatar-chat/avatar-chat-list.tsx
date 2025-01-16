"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  MessageSquare,
  MoreVertical,
  Trash2,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { AvatarConfigForm } from "@/components/ai/avatar-config-form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { AvatarChatListItem } from "@/types/avatar"

interface AvatarChatListProps {
  workspaceId: string
  initialChats: AvatarChatListItem[]
}

export function AvatarChatList({
  workspaceId,
  initialChats,
}: AvatarChatListProps) {
  const [chats, setChats] = useState(initialChats)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [isDeletingChat, setIsDeletingChat] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleNewChat = async (chatId: string) => {
    setIsNewChatOpen(false)
    router.push(`/workspaces/${workspaceId}/avatar-chat/${chatId}`)
    router.refresh()
  }

  const handleDeleteChat = async (chatId: string) => {
    setIsDeletingChat(chatId)
    try {
      const { error: deleteError } = await supabase
        .from("avatar_chats")
        .delete()
        .eq("id", chatId)

      if (deleteError) {
        console.error("Error deleting chat:", deleteError)
        throw deleteError
      }

      setChats((prev) => prev.filter((chat) => chat.id !== chatId))
      toast.success("Chat deleted successfully")
    } catch (error) {
      console.error("Error in handleDeleteChat:", error)
    } finally {
      setIsDeletingChat(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-[60px] min-h-[60px] items-center justify-between border-b px-4">
        <h1 className="text-xl font-semibold">AI Chat History</h1>
        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <AvatarConfigForm
              workspaceId={workspaceId}
              onSuccess={handleNewChat}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {chats.map((chat) => (
            <div key={chat.id} className="group relative">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() =>
                  router.push(
                    `/workspaces/${workspaceId}/avatar-chat/${chat.id}`
                  )
                }
              >
                <div className="flex w-full items-start gap-3">
                  <MessageSquare className="mt-1 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{chat.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(chat.last_message_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {chat.preview}
                    </p>
                  </div>
                </div>
              </Button>
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isDeletingChat === chat.id}
                    >
                      {isDeletingChat === chat.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteChat(chat.id)}
                      disabled={isDeletingChat === chat.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <MessageSquare className="mb-2 h-12 w-12" />
              <h3 className="mb-1 text-lg font-medium">No chats yet</h3>
              <p className="text-sm">Create a new chat to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
