"use client"

import Link from "next/link"
import { Plus, LogOut, ChevronUp, Settings } from "lucide-react"
import { WorkspaceCard } from "@/components/workspace/workspace-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignOutModal } from "@/components/modals/sign-out-modal"
import { ProfileSettingsModal } from "@/components/modals/profile-settings-modal"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface WorkspaceMember {
  user_id: string
  role: "owner" | "member"
}

interface Workspace {
  id: string
  name: string
  image_url: string | null
  workspace_members: WorkspaceMember[]
  channels: Array<{ id: string; name: string }>
}

interface WorkspacesListProps {
  initialWorkspaces: Workspace[]
  userId: string
  user: any
  profile: any
  error?: string
  success?: string
}

function NewWorkspaceCard() {
  return (
    <Link
      href="/workspaces/new"
      className="group aspect-square rounded-xl flex flex-col items-center justify-center p-4 relative border-2 border-transparent hover:border-gray-900 dark:hover:border-gray-100 cursor-pointer"
    >
      <div className="relative aspect-square w-32 mx-auto mb-2">
        <div className="relative w-full h-full rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Plus className="h-12 w-12 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      <span className="text-lg font-medium text-center mb-1 text-gray-900 dark:text-gray-100">
        New Workspace
      </span>
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        <span>Create new</span>
      </div>
    </Link>
  )
}

export function WorkspacesList({
  initialWorkspaces,
  userId,
  user,
  profile,
  error,
  success,
}: WorkspacesListProps) {
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      })
    }
  }, [error, toast])

  // Show success toast if there's a success message
  useEffect(() => {
    if (success) {
      toast({
        title: "Success",
        description: success,
      })
    }
  }, [success, toast])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "Please try again.",
      })
    }
  }

  // Process workspaces to determine user membership
  const processedWorkspaces = initialWorkspaces.map((workspace: Workspace) => ({
    ...workspace,
    isMember: workspace.workspace_members.some(
      (member: WorkspaceMember) => member.user_id === userId
    ),
    memberCount: workspace.workspace_members.length,
    userRole: workspace.workspace_members.find(
      (member: WorkspaceMember) => member.user_id === userId
    )?.role,
  }))

  // Split workspaces into user's workspaces and discoverable workspaces
  const userWorkspaces = processedWorkspaces.filter((w) => w.isMember) || []
  const discoverWorkspaces =
    processedWorkspaces.filter((w) => !w.isMember) || []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with user profile */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-[60px] flex items-center justify-between">
          <h1 className="text-xl font-semibold">Workspaces</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.display_name?.charAt(0) || user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {profile?.display_name && (
                    <p className="font-medium">{profile.display_name}</p>
                  )}
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => setShowProfileModal(true)}
              >
                <Settings className="h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ThemeToggle />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onSelect={() => setShowSignOutModal(true)}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 py-12">
        <div className="w-full max-w-6xl px-4 mx-auto">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Your Workspaces</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {userWorkspaces.map((workspace) => {
                const defaultChannel = workspace.channels?.[0]
                const href = defaultChannel
                  ? `/workspaces/${workspace.id}/channels/${defaultChannel.id}`
                  : `/workspaces/${workspace.id}`

                return (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    href={href}
                  />
                )
              })}
              <NewWorkspaceCard />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Discover Workspaces</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {discoverWorkspaces.map((workspace) => {
                const defaultChannel = workspace.channels?.[0]
                const href = defaultChannel
                  ? `/workspaces/${workspace.id}/channels/${defaultChannel.id}`
                  : `/workspaces/${workspace.id}`

                return (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    href={href}
                    showJoin={true}
                  />
                )
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Sign Out Modal */}
      <SignOutModal
        open={showSignOutModal}
        onOpenChange={setShowSignOutModal}
        onConfirm={handleSignOut}
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
