import { UserStatusType } from "@/types/user-status"
import { getStatusConfig } from "@/constants/user-status"

interface UserStatusProps {
  status?: UserStatusType
  className?: string
}

export function UserStatus({ status = "offline", className }: UserStatusProps) {
  const statusConfig = getStatusConfig(status)
  return (
    <div
      className={`h-2.5 w-2.5 rounded-full ${statusConfig.color} ${className}`}
    />
  )
}
