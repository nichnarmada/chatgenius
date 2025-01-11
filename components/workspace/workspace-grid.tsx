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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {workspaces.map((workspace) => (
          <Link
            key={workspace.id}
            href={`/workspaces/${workspace.id}`}
            className="group flex aspect-square flex-col items-center justify-center rounded-xl bg-muted p-4 transition-all duration-300 hover:shadow-lg"
          >
            <div className="relative mb-2 h-3/4 w-full">
              <Image
                src={
                  workspace.image_url ||
                  `/placeholder.svg?height=150&width=150&text=${workspace.name}`
                }
                alt={workspace.name}
                fill
                className="rounded-lg object-cover transition-all duration-300 group-hover:ring-2 group-hover:ring-primary"
              />
            </div>
            <span className="text-center text-lg font-medium">
              {workspace.name}
            </span>
          </Link>
        ))}

        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex aspect-square flex-col items-center justify-center rounded-xl bg-muted p-4 transition-all duration-300 hover:shadow-lg"
        >
          <div className="relative mb-2 flex h-3/4 w-full items-center justify-center">
            <Plus className="h-16 w-16 text-muted-foreground transition-all duration-300 group-hover:text-primary" />
          </div>
          <span className="text-center text-lg font-medium">New Workspace</span>
        </button>
      </div>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
