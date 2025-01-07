import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'

// Mock data for workspaces
const workspaces = [
  { id: 1, name: "Project Alpha" },
  { id: 2, name: "Team Beta" },
  { id: 3, name: "Marketing" },
  { id: 4, name: "Development" },
  { id: 5, name: "Design" },
]

export default function WorkspacesPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Choose a Workspace</h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {workspaces.map((workspace) => (
            <Link 
              key={workspace.id} 
              href={`/chat/${workspace.id}`}
              className="group aspect-square rounded-xl bg-gray-100 flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg"
            >
              <div className="relative w-full h-3/4 mb-2">
                <Image
                  src={`/placeholder.svg?height=150&width=150&text=${workspace.name}`}
                  alt={workspace.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg group-hover:ring-2 group-hover:ring-blue-500 transition-all duration-300"
                />
              </div>
              <span className="text-lg font-medium text-center">{workspace.name}</span>
            </Link>
          ))}
          
          <Link 
            href="/workspaces/new"
            className="group aspect-square rounded-xl bg-gray-100 flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg"
          >
            <div className="relative w-full h-3/4 mb-2 flex items-center justify-center">
              <Plus className="h-16 w-16 text-gray-400 group-hover:text-blue-500 transition-all duration-300" />
            </div>
            <span className="text-lg font-medium text-center">New Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

