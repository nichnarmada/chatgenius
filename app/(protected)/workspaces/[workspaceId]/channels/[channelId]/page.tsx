import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hash, Send } from "lucide-react"

interface PageProps {
  params: {
    workspaceId: string
    channelId: string
  }
}

export default async function ChannelPage({ params }: PageProps) {
  // Await the params
  const { workspaceId, channelId } = await Promise.resolve(params)

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch channel details
  const { data: channel } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single()

  if (!channel) {
    redirect(`/workspaces/${workspaceId}`)
  }

  // Fetch messages for the channel
  const { data: messages } = await supabase
    .from("messages")
    .select(
      `
      *,
      user:users(name, profile_picture_url)
    `
    )
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })

  return (
    <div className="flex-1 flex flex-col">
      {/* Channel Header */}
      <div className="border-b flex items-center h-[60px] px-4">
        <Hash className="mr-2 h-5 w-5" />
        <h2 className="font-semibold text-lg">{channel.name}</h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-grow p-4">
        {messages?.map((msg) => (
          <div key={msg.id} className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold">{msg.user?.name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-1">{msg.content}</div>
          </div>
        ))}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <form className="flex items-center">
          <Input
            placeholder={`Message #${channel.name}`}
            className="flex-grow mr-2"
          />
          <Button type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
