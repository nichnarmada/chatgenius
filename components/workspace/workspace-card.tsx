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
  // Get the first letter and ensure it's uppercase
  const initial = name.charAt(0).toUpperCase()

  // Generate a consistent color based on the name
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-purple-100 text-purple-600",
    "bg-yellow-100 text-yellow-600",
    "bg-pink-100 text-pink-600",
    "bg-indigo-100 text-indigo-600",
  ]
  const colorIndex =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length
  const colorClass = colors[colorIndex]

  return (
    <div
      className={`w-full h-full rounded-lg ${colorClass} flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-500 transition-all duration-300`}
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

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    setShowJoinModal(true)
  }

  const isOwner = workspace.userRole === "owner"

  return (
    <>
      <Link
        href={href}
        className="group aspect-square rounded-xl flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg relative bg-white"
      >
        <div className="relative w-full h-3/4 mb-2">
          {workspace.image_url ? (
            <Image
              src={workspace.image_url}
              alt={workspace.name}
              fill
              className="rounded-lg object-cover group-hover:ring-2 group-hover:ring-blue-500 transition-all duration-300"
            />
          ) : (
            <WorkspacePlaceholder name={workspace.name} />
          )}
          {isOwner && (
            <div
              className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center"
              title="You are the owner"
            >
              <Star size={12} className="mr-1" />
              Owner
            </div>
          )}
        </div>
        <span className="text-lg font-medium text-center mb-1">
          {workspace.name}
        </span>
        <div className="flex items-center text-sm text-gray-500">
          <Users size={16} className="mr-1" />
          <span>{workspace.memberCount}</span>
        </div>
        {showJoin && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 rounded-full"
              onClick={handleJoinClick}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
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
