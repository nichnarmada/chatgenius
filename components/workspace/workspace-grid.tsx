"use client"

import { Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { CreateWorkspaceModal } from "@/components/modals/create-workspace-modal"

interface Workspace {
  id: string
  name: string
  image_url: string | null
}

interface WorkspaceGridProps {
  workspaces: Workspace[]
}

export function WorkspaceGrid({ workspaces }: WorkspaceGridProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {workspaces.map((workspace) => (
          <Link
            key={workspace.id}
            href={`/workspaces/${workspace.id}`}
            className="group aspect-square rounded-xl bg-muted flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg"
          >
            <div className="relative w-full h-3/4 mb-2">
              <Image
                src={
                  workspace.image_url ||
                  `/placeholder.svg?height=150&width=150&text=${workspace.name}`
                }
                alt={workspace.name}
                fill
                className="object-cover rounded-lg group-hover:ring-2 group-hover:ring-primary transition-all duration-300"
              />
            </div>
            <span className="text-lg font-medium text-center">
              {workspace.name}
            </span>
          </Link>
        ))}

        <button
          onClick={() => setIsModalOpen(true)}
          className="group aspect-square rounded-xl bg-muted flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg"
        >
          <div className="relative w-full h-3/4 mb-2 flex items-center justify-center">
            <Plus className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-all duration-300" />
          </div>
          <span className="text-lg font-medium text-center">New Workspace</span>
        </button>
      </div>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
