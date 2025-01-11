"use client"

import Link from "next/link"
import { Users, Star } from "lucide-react"
import { useState } from "react"
import { JoinWorkspaceModal } from "@/components/modals/join-workspace-modal"
import Image from "next/image"

interface WorkspaceCardProps {
  workspace: {
    id: string
    name: string
    image_url: string | null
    memberCount: number
    userRole?: string
    isMember?: boolean
  }
  href: string
  showJoin?: boolean
}

function WorkspacePlaceholder({ name }: { name: string }) {
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
      <span className="text-4xl font-bold">{initial}</span>
    </div>
  )
}

export function WorkspaceCard({
  workspace,
  href,
  showJoin = false,
}: WorkspaceCardProps) {
  const [showJoinModal, setShowJoinModal] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (showJoin && !workspace.isMember) {
      e.preventDefault()
      setShowJoinModal(true)
    }
  }

  const isOwner = workspace.userRole === "owner"

  return (
    <>
      <Link href={href} onClick={handleClick}>
        <div className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-transparent p-4 hover:border-gray-900 dark:hover:border-gray-100">
          <div className="relative mx-auto mb-2 aspect-square w-32">
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
            {isOwner && (
              <div
                className="absolute left-0 top-0 flex items-center rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white dark:bg-blue-600"
                title="You are the owner"
              >
                <Star size={12} className="mr-1" />
                Owner
              </div>
            )}
          </div>
          <span className="mb-1 text-center text-lg font-medium text-gray-900 dark:text-gray-100">
            {workspace.name}
          </span>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Users size={16} className="mr-1" />
            <span>{workspace.memberCount}</span>
          </div>
        </div>
      </Link>

      <JoinWorkspaceModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        workspace={workspace}
      />
    </>
  )
}
