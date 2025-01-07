"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { WorkspaceCard } from "@/components/workspace/workspace-card"

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
}

function NewWorkspaceCard() {
  return (
    <Link
      href="/workspaces/new"
      className="group aspect-square rounded-xl flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg relative bg-white"
    >
      <div className="relative w-full h-3/4 mb-2 flex items-center justify-center bg-gray-50 rounded-lg group-hover:ring-2 group-hover:ring-blue-500 transition-all duration-300">
        <Plus className="h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-all duration-300" />
      </div>
      <span className="text-lg font-medium text-center mb-1">
        New Workspace
      </span>
      <div className="h-6" /> {/* Spacer to match member count height */}
    </Link>
  )
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
  )
}
