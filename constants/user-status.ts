import { UserStatusType } from "@/types/user-status"

export const USER_STATUS_CONFIG = {
  online: {
    type: "online" as UserStatusType,
    color: "bg-green-500",
    text: "Online",
  },
  away: {
    type: "away" as UserStatusType,
    color: "bg-yellow-500",
    text: "Away",
  },
  busy: {
    type: "busy" as UserStatusType,
    color: "bg-red-500",
    text: "Busy",
  },
  offline: {
    type: "offline" as UserStatusType,
    color: "bg-gray-500",
    text: "Invisible",
  },
} as const

// Ordered list of statuses for consistent display order
export const USER_STATUS_ORDER = ["online", "away", "busy", "offline"] as const

// Helper function to get status config
export function getStatusConfig(status: UserStatusType) {
  return USER_STATUS_CONFIG[status]
}
