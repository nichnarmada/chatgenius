"use client"

import { Button } from "@/components/ui/button"
import { Hash, Plus } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { CreateChannelModal } from "@/components/modals/create-channel-modal"
import Link from "next/link"
import { useParams } from "next/navigation"

interface WorkspaceLayoutProps {
  children: React.ReactNode
  workspace: any
  channels: any[]
  workspaceId: string
  user: any
}

export function WorkspaceLayout({
  children,
  workspace,
  channels: initialChannels,
  workspaceId,
  user,
}: WorkspaceLayoutProps) {
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [channels, setChannels] = useState(initialChannels)
  const params = useParams()
  const currentChannelId = params.channelId as string

  function handleChannelCreated(newChannel: any) {
    setChannels([...channels, newChannel])
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-background border-r flex flex-col">
        {/* Workspace name */}
        <div className="border-b flex items-center justify-between h-[60px] px-4">
          <h1 className="font-semibold text-lg">{workspace.name}</h1>
        </div>

        {/* Channels and DMs */}
        <ScrollArea className="flex-grow">
          <div className="p-4">
            <h2 className="font-semibold mb-2 text-muted-foreground uppercase text-sm">
              Channels
            </h2>
            <ul className="space-y-1">
              {channels?.map((channel) => (
                <li key={channel.id}>
                  <Button
                    variant={
                      channel.id === currentChannelId ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      href={`/workspaces/${workspaceId}/channels/${channel.id}`}
                    >
                      <Hash className="mr-2 h-4 w-4" />
                      {channel.name}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              className="w-full justify-start mt-2"
              onClick={() => setIsCreateChannelOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
          </div>

          <div className="p-4">
            <h2 className="font-semibold mb-2 text-muted-foreground uppercase text-sm">
              Direct Messages
            </h2>
            <ul className="space-y-1">
              {["Alice", "Bob", "Charlie"].map((user) => (
                <li key={user}>
                  <Button variant="ghost" className="w-full justify-start">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    {user}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        workspaceId={workspaceId}
        onChannelCreated={handleChannelCreated}
      />
    </div>
  )
}
