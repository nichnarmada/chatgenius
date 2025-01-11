import { BaseChatInput, BaseChatInputProps } from "./base-chat-input"
import { X } from "lucide-react"
import { Button } from "../ui/button"

interface MessageInputProps
  extends Omit<BaseChatInputProps, "showError" | "className"> {
  onCancel?: () => void
}

export function MessageInput({
  onSubmit,
  onCancel,
  defaultValue = "",
  placeholder = "Type a message...",
  autoFocus = false,
  disabled = false,
}: MessageInputProps) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <BaseChatInput
          onSubmit={onSubmit}
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className="min-h-[44px]"
        />
      </div>
      {onCancel && (
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
