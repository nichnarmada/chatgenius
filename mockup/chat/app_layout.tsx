import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, Hash, Plus } from 'lucide-react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 text-white flex flex-col">
            {/* Workspace name */}
            <div className="p-4 flex items-center justify-between">
              <h1 className="font-semibold text-lg">Workspace Name</h1>
              <ChevronDown className="h-5 w-5" />
            </div>
            <Separator />
            {/* Channels */}
            <ScrollArea className="flex-grow">
              <div className="p-4">
                <h2 className="font-semibold mb-2 text-gray-400 uppercase text-sm">Channels</h2>
                <ul>
                  {['general', 'random', 'announcements'].map((channel) => (
                    <li key={channel} className="mb-1">
                      <Button variant="ghost" className="w-full justify-start">
                        <Hash className="mr-2 h-4 w-4" />
                        {channel}
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" className="w-full justify-start mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Channel
                </Button>
              </div>
              {/* Direct Messages */}
              <div className="p-4">
                <h2 className="font-semibold mb-2 text-gray-400 uppercase text-sm">Direct Messages</h2>
                <ul>
                  {['Alice', 'Bob', 'Charlie'].map((user) => (
                    <li key={user} className="mb-1">
                      <Button variant="ghost" className="w-full justify-start">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        {user}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}

