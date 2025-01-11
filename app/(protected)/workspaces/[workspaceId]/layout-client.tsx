"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Hash,
  Plus,
  LogOut,
  ChevronDown,
  ChevronUp,
  Settings,
  ArrowLeftRight,
  DoorOpen,
} from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SignOutModal } from "@/components/modals/sign-out-modal"
import { CreateChannelModal } from "@/components/modals/create-channel-modal"
import { InviteModal } from "@/components/modals/invite-modal"
import { ProfileSettingsModal } from "@/components/modals/profile-settings-modal"
import { WorkspaceSettingsModal } from "@/components/modals/workspace-settings-modal"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { LeaveWorkspaceModal } from "@/components/modals/leave-workspace-modal"
import { UserStatus } from "@/components/user-status"
import type { UserStatusType } from "@/types/user-status"
import { USER_STATUS_CONFIG, USER_STATUS_ORDER } from "@/constants/user-status"
import { Workspace, Channel } from "@/types/workspace"
import { Profile } from "@/types/profile"
import { User } from "@supabase/supabase-js"

interface WorkspaceLayoutClientProps {
  children: React.ReactNode
  workspace: Workspace
  channels: Channel[]
  user: User
  profile: Profile
  workspaceUsers: Profile[]
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
      className={`h-full w-full rounded-full ${colorClass} flex items-center justify-center border-2 border-transparent`}
    >
      <span className="text-xl font-bold">{initial}</span>
    </div>
  )
}

export function WorkspaceLayoutClient({
  children,
  workspace: initialWorkspace,
  channels,
  user,
  profile,
  workspaceUsers: initialWorkspaceUsers,
}: WorkspaceLayoutClientProps) {
  const [workspace, setWorkspace] = useState(initialWorkspace)
  const [workspaceUsers, setWorkspaceUsers] = useState(initialWorkspaceUsers)
  const [userStatuses, setUserStatuses] = useState<
    Record<string, UserStatusType>
  >({})
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showLeaveWorkspaceModal, setShowLeaveWorkspaceModal] = useState(false)
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showWorkspaceSettingsModal, setShowWorkspaceSettingsModal] =
    useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | undefined>()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchStatuses = async () => {
      const { data: statuses } = await supabase
        .from("user_status")
        .select("user_id, status")

      if (statuses) {
        const statusMap = statuses.reduce(
          (acc, curr) => {
            acc[curr.user_id] = curr.status
            return acc
          },
          {} as Record<string, UserStatusType>
        )
        setUserStatuses(statusMap)
      }
    }

    fetchStatuses()

    const statusChannel = supabase
      .channel("user_statuses")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_status",
        },
        (payload) => {
          if (payload.new) {
            setUserStatuses((prev) => ({
              ...prev,
              [(payload.new as any).user_id]: (payload.new as any).status,
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(statusChannel)
    }
  }, [])

  useEffect(() => {
    const workspaceChannel = supabase
      .channel("workspace_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "workspaces",
          filter: `id=eq.${workspace.id}`,
        },
        async (payload) => {
          setWorkspace((prev) => ({
            ...prev,
            ...payload.new,
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(workspaceChannel)
    }
  }, [workspace.id, supabase])

  useEffect(() => {
    const workspaceChannel = supabase
      .channel(`workspace_${workspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_members",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        async () => {
          const { data: updatedUsers } = await supabase
            .from("profiles")
            .select(
              `
              id,
              email,
              display_name,
              avatar_url
            `
            )
            .in(
              "id",
              workspace.workspace_members.map((member) => member.user_id)
            )

          if (updatedUsers) {
            setWorkspaceUsers(updatedUsers)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(workspaceChannel)
    }
  }, [workspace.id, workspace.workspace_members, supabase])

  // Check if user is owner
  const isOwner = workspace.workspace_members?.some(
    (member) => member.user_id === user.id && member.role === "owner"
  )

  const handleLeaveWorkspace = async () => {
    if (isLeaving) return

    // Prevent owners from even trying to leave
    if (isOwner) {
      setLeaveError(
        "You cannot leave this workspace because you are the owner. Transfer ownership to another member first."
      )
      return
    }

    try {
      setIsLeaving(true)
      setLeaveError(undefined)
      const response = await fetch(`/api/workspaces/${workspace.id}/leave`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave workspace")
      }

      toast({
        title: "Left workspace",
        description: "You have successfully left the workspace.",
      })

      setShowLeaveWorkspaceModal(false)
      router.push("/workspaces")
    } catch (error) {
      console.error("Error leaving workspace:", error)
      setLeaveError(
        error instanceof Error ? error.message : "Failed to leave workspace"
      )
    } finally {
      setIsLeaving(false)
    }
  }

  const handleSignOut = async () => {
    // Update status to offline and remove session before signing out
    await Promise.all([
      supabase
        .from("user_status")
        .update({ status: "offline" })
        .eq("user_id", user.id),
      supabase.from("user_sessions").delete().eq("user_id", user.id),
    ])

    await supabase.auth.signOut()
    router.push("/login")
  }

  const updateStatus = async (status: UserStatusType) => {
    try {
      const response = await fetch("/api/users/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      // Update local state immediately
      setUserStatuses((prev) => ({
        ...prev,
        [user.id]: status,
      }))

      toast({
        title: "Status updated",
        description: `Your status is now ${status}`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      })
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r bg-muted">
        {/* Workspace Name */}
        <div className="h-[60px] min-h-[60px] border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-full w-full justify-start px-4"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8">
                      {workspace.image_url ? (
                        <div className="relative h-full w-full overflow-hidden rounded-full">
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
                    <h1 className="text-lg font-semibold">{workspace.name}</h1>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem
                onSelect={() => setShowWorkspaceSettingsModal(true)}
              >
                <div className="flex w-full items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Workspace Settings
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/workspaces" className="cursor-pointer">
                  <div className="flex w-full items-center">
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Switch Workspace
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setShowLeaveWorkspaceModal(true)}
              >
                <div className="flex w-full items-center text-destructive">
                  <DoorOpen className="mr-2 h-4 w-4" />
                  Leave Workspace
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Channels Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-8">
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
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
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
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
                          <div className="relative">
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={workspaceUser.avatar_url || undefined}
                              />
                              <AvatarFallback>
                                {workspaceUser.display_name?.charAt(0) ||
                                  workspaceUser.email?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5">
                              <UserStatus
                                status={userStatuses[workspaceUser.id]}
                              />
                            </div>
                          </div>
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
        {/* <div className="px-4 py-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Others
          </Button>
        </div> */}

        {/* User Profile Section */}
        <div className="h-[60px] min-h-[60px] border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-full w-full px-4">
                <div className="flex w-full items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile?.display_name?.charAt(0) ||
                        profile?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start">
                    <span className="text-sm font-medium">
                      {profile?.display_name || profile?.email}
                    </span>
                    <div className="flex items-center gap-1">
                      <UserStatus status={userStatuses[user.id]} />
                      <span className="text-xs capitalize text-muted-foreground">
                        {userStatuses[user.id] || "offline"}
                      </span>
                    </div>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" sideOffset={4} className="w-56">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <div className="flex items-center gap-2">
                    <UserStatus status={userStatuses[user.id]} />
                    <span>Set a status</span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent
                    sideOffset={8}
                    className="min-w-[150px]"
                  >
                    {USER_STATUS_ORDER.map((statusKey) => {
                      const status = USER_STATUS_CONFIG[statusKey]
                      return (
                        <DropdownMenuItem
                          key={status.type}
                          onClick={() => updateStatus(status.type)}
                        >
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${status.color}`}
                          />
                          <span>{status.text}</span>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setShowProfileModal(true)}>
                <div className="flex w-full items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ThemeToggle />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setShowSignOutModal(true)}>
                <div className="flex w-full items-center text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>

      {/* Modals */}
      <SignOutModal
        open={showSignOutModal}
        onOpenChange={setShowSignOutModal}
        onConfirm={handleSignOut}
      />

      <LeaveWorkspaceModal
        open={showLeaveWorkspaceModal}
        onOpenChange={(open) => {
          setShowLeaveWorkspaceModal(open)
          if (!open) {
            setLeaveError(undefined)
          }
        }}
        onConfirm={handleLeaveWorkspace}
        isLoading={isLeaving}
        error={leaveError}
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

      <WorkspaceSettingsModal
        isOpen={showWorkspaceSettingsModal}
        onClose={() => setShowWorkspaceSettingsModal(false)}
        workspace={workspace}
      />
    </div>
  )
}
