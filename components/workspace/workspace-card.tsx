"use client"

import Link from "next/link"
import { Users, UserPlus, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      className={`w-full h-full rounded-full ${colorClass} flex items-center justify-center border-2 border-transparent`}
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
        <div className="group aspect-square rounded-xl flex flex-col items-center justify-center p-4 relative border-2 border-transparent hover:border-gray-900 dark:hover:border-gray-100 cursor-pointer">
          <div className="relative aspect-square w-32 mx-auto mb-2">
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
            {isOwner && (
              <div
                className="absolute top-0 left-0 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center dark:bg-blue-600"
                title="You are the owner"
              >
                <Star size={12} className="mr-1" />
                Owner
              </div>
            )}
          </div>
          <span className="text-lg font-medium text-center mb-1 text-gray-900 dark:text-gray-100">
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
