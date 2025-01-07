"use client"

import { createClient } from "@/utils/supabase/client"
import { redirect, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Hash } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, ChevronUp } from "lucide-react"
import { SignOutModal } from "@/components/modals/sign-out-modal"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface WorkspaceLayoutClientProps {
  children: React.ReactNode
  workspace: any
  channels: any[]
  user: any
  profile: any
}

export function WorkspaceLayoutClient({
  children,
  workspace,
  channels,
  user,
  profile,
}: WorkspaceLayoutClientProps) {
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-muted flex flex-col">
        {/* Workspace Name */}
        <div className="h-[60px] flex items-center px-4 border-b">
          <h1 className="font-semibold text-lg">{workspace.name}</h1>
        </div>

        {/* Channels Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              CHANNELS
            </h2>
            <div className="space-y-1">
              {channels?.map((channel) => {
                const channelUrl = `/workspaces/${workspace.id}/channels/${channel.id}`
                const isActive = pathname === channelUrl

                return (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                    asChild
                  >
                    <Link href={channelUrl}>
                      <Hash className="mr-2 h-4 w-4" />
                      {channel.name}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              DIRECT MESSAGES
            </h2>
            {/* Direct messages will go here */}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {profile?.display_name?.charAt(0) ||
                        user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {profile?.display_name || user.email}
                    </p>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/workspaces" className="cursor-pointer">
                  Switch Workspace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ThemeToggle />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setShowSignOutModal(true)}>
                <div className="flex items-center w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Sign Out Modal */}
      <SignOutModal
        open={showSignOutModal}
        onOpenChange={setShowSignOutModal}
        onConfirm={handleSignOut}
      />
    </div>
  )
}
