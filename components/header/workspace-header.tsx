"use client"

import { Hash, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Channel } from "@/types/workspace"
import { Profile } from "@/types/profile"
import { Button } from "@/components/ui/button"

interface WorkspaceHeaderProps {
  type: "channel" | "dm"
  channel?: Channel
  otherUser?: Profile
  onSearchClick?: () => void
}

export function WorkspaceHeader({
  type,
  channel,
  otherUser,
  onSearchClick,
}: WorkspaceHeaderProps) {
  const baseHeaderClasses =
    "flex h-[60px] min-h-[60px] items-center border-b px-4"

  const renderSearchButton = () => (
    <div className="ml-auto flex items-center">
      <Button
        variant="outline"
        className="text-xs text-muted-foreground"
        onClick={onSearchClick}
      >
        <Search className="mr-2 h-4 w-4" />
        Search
        <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
    </div>
  )

  if (type === "channel" && channel) {
    return (
      <div className={baseHeaderClasses}>
        <Hash className="mr-2 h-5 w-5" />
        <h2 className="text-lg font-semibold">{channel.name}</h2>
        {renderSearchButton()}
      </div>
    )
  }

  if (type === "dm" && otherUser) {
    return (
      <div className={baseHeaderClasses}>
        <Avatar className="mr-2 h-8 w-8">
          <AvatarImage src={otherUser.avatar_url || undefined} />
          <AvatarFallback>
            {otherUser.display_name?.charAt(0) || otherUser.email?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">
          {otherUser.display_name || otherUser.email}
        </h2>
        {renderSearchButton()}
      </div>
    )
  }

  return null
}
