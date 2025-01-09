"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { redirect, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Hash,
  Plus,
  LogOut,
  ChevronUp,
  UserPlus,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SignOutModal } from "@/components/modals/sign-out-modal"
import { CreateChannelModal } from "@/components/modals/create-channel-modal"
import { InviteModal } from "@/components/modals/invite-modal"
import { ProfileSettingsModal } from "@/components/modals/profile-settings-modal"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface WorkspaceUser {
  id: string
  email: string
  display_name: string
  avatar_url?: string
}

interface Workspace {
  id: string
  name: string
  image_url: string | null
}

interface WorkspaceLayoutClientProps {
  children: React.ReactNode
  workspace: Workspace
  channels: any[]
  user: any
  profile: any
  workspaceUsers: WorkspaceUser[]
}

interface WorkspacePlaceholderProps {
  name: string
}

function WorkspacePlaceholder({ name }: WorkspacePlaceholderProps) {
  const initial = name.charAt(0).toUpperCase()

  // Color classes with background colors and text colors
  const colors = [
    "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
    "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300",
    "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300",
    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300",
    "bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300",
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300",
  ]
  const colorIndex =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length
  const colorClass = colors[colorIndex]

  return (
    <div
      className={`w-full h-full rounded-full ${colorClass} flex items-center justify-center border-2 border-transparent`}
    >
      <span className="text-xl font-bold">{initial}</span>
    </div>
  )
}

export function WorkspaceLayoutClient({
  children,
  workspace,
  channels,
  user,
  profile,
  workspaceUsers,
}: WorkspaceLayoutClientProps) {
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-muted flex flex-col">
        {/* Workspace Name */}
        <div className="h-[60px] flex items-center gap-3 px-4 border-b">
          <div className="relative h-8 w-8">
            {workspace.image_url ? (
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <Image
                  src={workspace.image_url}
                  alt={workspace.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <WorkspacePlaceholder name={workspace.name} />
            )}
          </div>
          <h1 className="font-semibold text-lg">{workspace.name}</h1>
        </div>

        {/* Channels Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              CHANNELS
            </h2>
            <div className="space-y-1">
              {channels?.map((channel) => {
                const channelUrl = `/workspaces/${workspace.id}/channels/${channel.id}`
                const isActive = pathname.startsWith(channelUrl)

                return (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start hover:bg-muted-foreground/10"
                    )}
                    asChild
                  >
                    <Link href={channelUrl}>
                      <Hash className="mr-2 h-4 w-4" />
                      {channel.name}
                    </Link>
                  </Button>
                )
              })}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setIsCreateChannelOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Channel
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              DIRECT MESSAGES
            </h2>
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {workspaceUsers
                  .filter((workspaceUser) => workspaceUser.id !== user.id)
                  .map((workspaceUser) => (
                    <Button
                      key={workspaceUser.id}
                      variant="ghost"
                      className="w-full justify-start hover:bg-muted-foreground/10"
                      asChild
                    >
                      <Link
                        href={`/workspaces/${workspace.id}/dm/${workspaceUser.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={workspaceUser.avatar_url} />
                            <AvatarFallback>
                              {workspaceUser.display_name?.charAt(0) ||
                                workspaceUser.email?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {workspaceUser.display_name || workspaceUser.email}
                          </span>
                        </div>
                      </Link>
                    </Button>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Invite Users Button */}
        <div className="px-4 py-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Others
          </Button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.display_name?.charAt(0) ||
                        user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {profile?.display_name || user.email}
                    </p>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => setShowProfileModal(true)}>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/workspaces" className="cursor-pointer">
                  Switch Workspace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ThemeToggle />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setShowSignOutModal(true)}>
                <div className="flex items-center w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Modals */}
      <SignOutModal
        open={showSignOutModal}
        onOpenChange={setShowSignOutModal}
        onConfirm={handleSignOut}
      />

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        workspaceId={workspace.id}
        onChannelCreated={(newChannel) => {
          router.refresh()
        }}
      />

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={workspace.id}
      />

      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        profile={profile}
      />
    </div>
  )
}
