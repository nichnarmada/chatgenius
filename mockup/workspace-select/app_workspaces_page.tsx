import Link from 'next/link'
import Image from 'next/image'
import { Plus, UserPlus } from 'lucide-react'

// Mock data for user's workspaces
const userWorkspaces = [
  { id: 1, name: "Project Alpha" },
  { id: 2, name: "Team Beta" },
  { id: 3, name: "Marketing" },
]

// Mock data for discoverable workspaces
const discoverWorkspaces = [
  { id: 4, name: "Development" },
  { id: 5, name: "Design" },
  { id: 6, name: "Sales" },
]

function WorkspaceCard({ workspace, href, action }: { workspace: { id: number; name: string }, href: string, action?: React.ReactNode }) {
  return (
    <Link 
      href={href}
      className="group aspect-square rounded-xl bg-gray-100 flex flex-col items-center justify-center p-4 transition-all duration-300 hover:shadow-lg relative"
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
      {action && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {action}
        </div>
      )}
    </Link>
  )
}

export default function WorkspacesPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12 bg-gray-100">
      <div className="w-full max-w-6xl px-4">
        <h1 className="text-3xl font-bold text-center mb-12">Workspaces</h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Your Workspaces</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {userWorkspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} href={`/chat/${workspace.id}`} />
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
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Discover Workspaces</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {discoverWorkspaces.map((workspace) => (
              <WorkspaceCard 
                key={workspace.id} 
                workspace={workspace} 
                href={`/workspaces/join/${workspace.id}`}
                action={
                  <button className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors duration-300">
                    <UserPlus size={20} />
                  </button>
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

