import type { UserStatusType } from "@/types/user-status"
import { cn } from "@/lib/utils"

interface UserStatusProps {
  status: UserStatusType | null
}

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-500",
  away: "bg-yellow-500",
  busy: "bg-red-500",
}

export function UserStatus({ status }: UserStatusProps) {
  if (!status) return null

  return (
    <div className={cn("w-2.5 h-2.5 rounded-full", statusColors[status])} />
  )
}
