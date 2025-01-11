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
      <div className="flex w-64 flex-col border-r bg-background">
        {/* Workspace name */}
        <div className="flex h-[60px] items-center justify-between border-b px-4">
          <h1 className="text-lg font-semibold">{workspace.name}</h1>
        </div>

        {/* Channels and DMs */}
        <ScrollArea className="flex-grow">
          <div className="p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
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
              className="mt-2 w-full justify-start"
              onClick={() => setIsCreateChannelOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
          </div>

          <div className="p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
              Direct Messages
            </h2>
            <ul className="space-y-1">
              {["Alice", "Bob", "Charlie"].map((user) => (
                <li key={user}>
                  <Button variant="ghost" className="w-full justify-start">
                    <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                    {user}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 flex-col">{children}</main>

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        workspaceId={workspaceId}
        onChannelCreated={handleChannelCreated}
      />
    </div>
  )
}
