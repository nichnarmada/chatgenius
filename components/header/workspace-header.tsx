"use client"

import { Hash } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Channel } from "@/types/workspace"
import { Profile } from "@/types/profile"

interface WorkspaceHeaderProps {
  type: "channel" | "dm"
  channel?: Channel
  otherUser?: Profile
}

export function WorkspaceHeader({
  type,
  channel,
  otherUser,
}: WorkspaceHeaderProps) {
  if (type === "channel" && channel) {
    return (
      <div className="flex h-[60px] min-h-[60px] items-center border-b px-4">
        <Hash className="mr-2 h-5 w-5" />
        <h2 className="text-lg font-semibold">{channel.name}</h2>
      </div>
    )
  }

  if (type === "dm" && otherUser) {
    return (
      <div className="flex h-[60px] min-h-[60px] items-center border-b px-4">
        <Avatar className="mr-2 h-8 w-8">
          <AvatarImage src={otherUser.avatar_url || undefined} />
          <AvatarFallback>
            {otherUser.display_name?.charAt(0) || otherUser.email?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">
          {otherUser.display_name || otherUser.email}
        </h2>
      </div>
    )
  }

  return null
}
