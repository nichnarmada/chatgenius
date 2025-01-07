"use client"

import Link from "next/link"
import { Plus, Users, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { JoinWorkspaceModal } from "@/components/modals/join-workspace-modal"

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

function WorkspaceCard({
  workspace,
  href,
  showJoin = false,
}: {
  workspace: any
  href: string
  showJoin?: boolean
}) {
  const [showJoinModal, setShowJoinModal] = useState(false)

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    setShowJoinModal(true)
  }

  return (
    <>
      <Link
        href={href}
        className="group aspect-square rounded-xl bg-card flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg relative"
      >
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {showJoin ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleJoinClick}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {workspace.memberCount}
              </span>
            </>
          )}
        </div>
        <div className="relative w-full h-3/4 mb-2 flex items-center justify-center">
          {workspace.image_url ? (
            <img
              src={workspace.image_url}
              alt={workspace.name}
              className="rounded-lg object-cover w-full h-full group-hover:ring-2 group-hover:ring-primary transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-muted group-hover:ring-2 group-hover:ring-primary transition-all duration-300" />
          )}
        </div>
        <span className="text-lg font-medium text-center">
          {workspace.name}
        </span>
        {!showJoin && workspace.userRole && (
          <span className="text-sm text-muted-foreground mt-1">
            {workspace.userRole}
          </span>
        )}
      </Link>

      <JoinWorkspaceModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        workspace={workspace}
      />
    </>
  )
}

interface WorkspacesListProps {
  initialWorkspaces: Workspace[]
  userId: string
}

export function WorkspacesList({
  initialWorkspaces,
  userId,
}: WorkspacesListProps) {
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
    <div className="min-h-screen flex flex-col items-center justify-start py-12 bg-background">
      <div className="w-full max-w-6xl px-4">
        <h1 className="text-3xl font-bold text-center mb-12">Workspaces</h1>

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

            <Link
              href="/workspaces/new"
              className="group aspect-square rounded-xl bg-card flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg"
            >
              <div className="relative w-full h-3/4 mb-2 flex items-center justify-center">
                <Plus className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-all duration-300" />
              </div>
              <span className="text-lg font-medium text-center">
                New Workspace
              </span>
            </Link>
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
  )
}
